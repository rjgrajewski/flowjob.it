#!/bin/bash

# Deploy script for Aligno Scraper as ECS Scheduled Task (runs once per day)
set -e

# Load environment variables from .env file
if [ -f "../../../.env" ]; then
    echo "📝 Loading configuration from .env..."
    export $(grep -v '^#' ../../../.env | grep -v '^$' | xargs)
else
    echo "⚠️  .env file not found. Using default values or environment variables."
fi

# Configuration (use env vars or defaults)
AWS_REGION="${AWS_REGION:-eu-central-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID must be set in .env file}"
ECR_REPOSITORY="scraper"
ECS_CLUSTER="scraper-cluster"
TASK_DEFINITION_FAMILY="scraper"
SCHEDULE_RULE_NAME="scraper-daily-schedule"
# Cron: run daily at 2 AM UTC (4 AM CET in summer, 3 AM CET in winter)
SCHEDULE_EXPRESSION="cron(0 2 * * ? *)"

echo "🚀 Starting deployment of Aligno Scraper as Scheduled Task..."
echo "   AWS Account: ${AWS_ACCOUNT_ID}"
echo "   Region: ${AWS_REGION}"
echo "   Schedule: Daily at 2 AM UTC"
echo ""

# Detect platform and warn if ARM
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo "📱 Detected ARM64 architecture (Apple Silicon)"
    echo "   Building for linux/amd64 (AWS Fargate compatibility)"
    echo ""
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || {
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
    echo "✅ ECR repository created"
}

# Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "🔨 Building Docker image for linux/amd64 (AWS Fargate platform)..."
docker build --platform linux/amd64 -t $ECR_REPOSITORY -f Dockerfile ../../..

# Tag image for ECR
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "✅ Docker image pushed to ECR"

# Create CloudWatch log group if it doesn't exist
echo "📊 Setting up CloudWatch Logs..."
aws logs describe-log-groups --log-group-name-prefix "/ecs/$ECR_REPOSITORY" --region $AWS_REGION 2>/dev/null | grep -q "/ecs/$ECR_REPOSITORY" || {
    echo "Creating CloudWatch log group..."
    aws logs create-log-group --log-group-name "/ecs/$ECR_REPOSITORY" --region $AWS_REGION
}

# Generate task definition from template
echo "📝 Generating task definition from template..."
envsubst < ecs-task-definition.json.template > ecs-task-definition.json

# Register new task definition
echo "📋 Registering new task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region $AWS_REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

# Clean up generated file
rm -f ecs-task-definition.json

echo "✅ Task definition registered: $TASK_DEFINITION_ARN"

# Create ECS cluster if it doesn't exist or is inactive
echo "🏗️ Setting up ECS cluster..."
CLUSTER_STATUS=$(aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null)

if [ "$CLUSTER_STATUS" == "INACTIVE" ] || [ "$CLUSTER_STATUS" == "None" ] || [ -z "$CLUSTER_STATUS" ]; then
    echo "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION
    echo "✅ Cluster created"
else
    echo "✅ Cluster already exists and is active"
fi

# Get VPC and subnet information
echo "🔍 Finding network configuration..."

# Find default VPC or first available VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text 2>/dev/null || \
         aws ec2 describe-vpcs --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No VPC found. Please run setup-infrastructure.sh first."
    exit 1
fi

echo "Found VPC: $VPC_ID"

# Get subnets in the VPC
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'Subnets[*].SubnetId' --output text)

if [ -z "$SUBNET_IDS" ]; then
    echo "❌ No subnets found in VPC. Please run setup-infrastructure.sh first."
    exit 1
fi

# Convert to comma-separated list for the first subnet
SUBNET_ID=$(echo $SUBNET_IDS | awk '{print $1}')
echo "Using subnet: $SUBNET_ID"

# Find or create security group
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=scraper-sg" "Name=vpc-id,Values=$VPC_ID" \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$SECURITY_GROUP_ID" == "None" ] || [ -z "$SECURITY_GROUP_ID" ]; then
    echo "Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name scraper-sg \
        --description "Security group for Scraper" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    
    # Allow all outbound traffic
    aws ec2 authorize-security-group-egress \
        --group-id $SECURITY_GROUP_ID \
        --protocol -1 \
        --cidr 0.0.0.0/0 \
        --region $AWS_REGION 2>/dev/null || true
fi

echo "Using security group: $SECURITY_GROUP_ID"

# Create IAM role for EventBridge if it doesn't exist
echo "🔐 Setting up EventBridge IAM role..."
EVENTS_ROLE_NAME="scraper-eventbridge-role"
EVENTS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EVENTS_ROLE_NAME}"

aws iam get-role --role-name $EVENTS_ROLE_NAME --region $AWS_REGION 2>/dev/null || {
    echo "Creating EventBridge role..."
    aws iam create-role \
        --role-name $EVENTS_ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "events.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --region $AWS_REGION
    
    # Attach policy to allow running ECS tasks
    aws iam put-role-policy \
        --role-name $EVENTS_ROLE_NAME \
        --policy-name AllowECSTaskExecution \
        --policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecs:RunTask"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "ecs:cluster": "arn:aws:ecs:'$AWS_REGION':'$AWS_ACCOUNT_ID':cluster/'$ECS_CLUSTER'"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": "iam:PassRole",
                    "Resource": "*",
                    "Condition": {
                        "StringLike": {
                            "iam:PassedToService": "ecs-tasks.amazonaws.com"
                        }
                    }
                }
            ]
        }' \
        --region $AWS_REGION
    
    echo "✅ EventBridge role created"
}

# Create or update EventBridge rule
echo "⏰ Setting up scheduled task..."
aws events put-rule \
    --name $SCHEDULE_RULE_NAME \
    --schedule-expression "$SCHEDULE_EXPRESSION" \
    --state ENABLED \
    --description "Daily scraper execution at 2 AM UTC" \
    --region $AWS_REGION

echo "✅ EventBridge rule created/updated"

# Add ECS task as target to the rule
echo "🎯 Configuring task target..."
aws events put-targets \
    --rule $SCHEDULE_RULE_NAME \
    --targets "Id"="1","Arn"="arn:aws:ecs:${AWS_REGION}:${AWS_ACCOUNT_ID}:cluster/${ECS_CLUSTER}","RoleArn"="${EVENTS_ROLE_ARN}","EcsParameters"="{TaskDefinitionArn=${TASK_DEFINITION_ARN},TaskCount=1,LaunchType=FARGATE,NetworkConfiguration={awsvpcConfiguration={Subnets=[${SUBNET_ID}],SecurityGroups=[${SECURITY_GROUP_ID}],AssignPublicIp=ENABLED}},PlatformVersion=LATEST}" \
    --region $AWS_REGION

echo "✅ Task target configured"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Task runs daily at 2 AM UTC (${SCHEDULE_EXPRESSION})"
echo "   - Cluster: $ECS_CLUSTER"
echo "   - Task Definition: $TASK_DEFINITION_ARN"
echo "   - Schedule Rule: $SCHEDULE_RULE_NAME"
echo ""
echo "💰 Estimated costs:"
echo "   - ~\$0.08 per execution (~15-30 min)"
echo "   - ~\$2.40/month (30 days × \$0.08)"
echo "   - Plus RDS: ~\$14.80/month"
echo "   - TOTAL: ~\$17/month (vs ~\$75/month for 24/7 service)"
echo ""
echo "🔧 Useful commands:"
echo "   View schedule: aws events describe-rule --name $SCHEDULE_RULE_NAME --region $AWS_REGION"
echo "   Disable schedule: aws events disable-rule --name $SCHEDULE_RULE_NAME --region $AWS_REGION"
echo "   Enable schedule: aws events enable-rule --name $SCHEDULE_RULE_NAME --region $AWS_REGION"
echo "   Run manually: aws ecs run-task --cluster $ECS_CLUSTER --task-definition $TASK_DEFINITION_FAMILY --launch-type FARGATE --network-configuration \"awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}\" --region $AWS_REGION"
echo "   View logs: aws logs tail /ecs/scraper --follow --region $AWS_REGION"
echo ""
echo "📊 Monitor in AWS Console:"
echo "   https://$AWS_REGION.console.aws.amazon.com/ecs/v2/clusters/$ECS_CLUSTER"
echo "   https://$AWS_REGION.console.aws.amazon.com/events/home?region=$AWS_REGION#/eventbus/default/rules/$SCHEDULE_RULE_NAME"

