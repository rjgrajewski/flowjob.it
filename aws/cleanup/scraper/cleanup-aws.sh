#!/bin/bash

# Cleanup AWS resources for Aligno Scraper (keeping RDS only)
set -e

AWS_REGION="eu-central-1"
CLUSTER_NAME="aligno-scraper-cluster"

echo "🧹 Cleaning up AWS resources for Aligno Scraper..."
echo "⚠️  This will delete everything EXCEPT the RDS database"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# 1. Stop and delete ECS tasks
echo ""
echo "🛑 Stopping ECS tasks..."
TASK_ARNS=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION \
    --query 'taskArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$TASK_ARNS" ]; then
    for TASK_ARN in $TASK_ARNS; do
        echo "   Stopping task: $TASK_ARN"
        aws ecs stop-task \
            --cluster $CLUSTER_NAME \
            --task $TASK_ARN \
            --region $AWS_REGION >/dev/null || echo "   Failed to stop task"
    done
    echo "✅ Tasks stopped"
else
    echo "   No running tasks found"
fi

# 2. Delete ECS services
echo ""
echo "🗑️  Deleting ECS services..."
SERVICES=$(aws ecs list-services \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION \
    --query 'serviceArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SERVICES" ]; then
    for SERVICE_ARN in $SERVICES; do
        SERVICE_NAME=$(echo $SERVICE_ARN | awk -F/ '{print $NF}')
        echo "   Scaling down service: $SERVICE_NAME"
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --desired-count 0 \
            --region $AWS_REGION >/dev/null || echo "   Failed to scale down"
        
        echo "   Deleting service: $SERVICE_NAME"
        aws ecs delete-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force \
            --region $AWS_REGION >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Services deleted"
else
    echo "   No services found"
fi

# 3. Delete ECS cluster
echo ""
echo "🗑️  Deleting ECS cluster..."
aws ecs delete-cluster \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION >/dev/null 2>&1 && echo "✅ Cluster deleted" || echo "   Cluster not found or already deleted"

# 4. Delete EventBridge scheduled tasks
echo ""
echo "🗑️  Deleting EventBridge rules..."
SCHEDULE_RULES=$(aws events list-rules \
    --region $AWS_REGION \
    --query 'Rules[?contains(Name, `scraper`)].Name' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SCHEDULE_RULES" ]; then
    for RULE_NAME in $SCHEDULE_RULES; do
        echo "   Removing targets from rule: $RULE_NAME"
        # Get all target IDs
        TARGET_IDS=$(aws events list-targets-by-rule \
            --rule $RULE_NAME \
            --region $AWS_REGION \
            --query 'Targets[].Id' \
            --output text 2>/dev/null || echo "")
        
        if [ ! -z "$TARGET_IDS" ]; then
            aws events remove-targets \
                --rule $RULE_NAME \
                --ids $TARGET_IDS \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to remove targets"
        fi
        
        echo "   Deleting rule: $RULE_NAME"
        aws events delete-rule \
            --name $RULE_NAME \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete rule"
    done
    echo "✅ EventBridge rules deleted"
else
    echo "   No EventBridge rules found"
fi

# 5. Deregister task definitions
echo ""
echo "🗑️  Deregistering task definitions..."
TASK_DEFS=$(aws ecs list-task-definitions \
    --family-prefix scraper \
    --region $AWS_REGION \
    --query 'taskDefinitionArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$TASK_DEFS" ]; then
    for TASK_DEF in $TASK_DEFS; do
        echo "   Deregistering: $TASK_DEF"
        aws ecs deregister-task-definition \
            --task-definition $TASK_DEF \
            --region $AWS_REGION >/dev/null || echo "   Failed to deregister"
    done
    echo "✅ Task definitions deregistered"
else
    echo "   No task definitions found"
fi

# 6. Delete ECR repository
echo ""
echo "🗑️  Deleting ECR repository..."
aws ecr delete-repository \
    --repository-name aligno-scraper \
    --force \
    --region $AWS_REGION >/dev/null 2>&1 && echo "✅ ECR repository deleted" || echo "   Repository not found or already deleted"

# 7. Delete CloudWatch log group
echo ""
echo "🗑️  Deleting CloudWatch log group..."
aws logs delete-log-group \
    --log-group-name /ecs/scraper \
    --region $AWS_REGION 2>&1 && echo "✅ Log group deleted" || echo "   Log group not found or already deleted"

# 8. Delete IAM role policies and roles
echo ""
echo "🗑️  Deleting IAM roles and policies..."

# Delete EventBridge role
ROLE_NAME="scraper-eventbridge-role"
POLICIES=$(aws iam list-role-policies \
    --role-name $ROLE_NAME \
    --region $AWS_REGION \
    --query 'PolicyNames[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$POLICIES" ]; then
    for POLICY in $POLICIES; do
        echo "   Deleting policy $POLICY from $ROLE_NAME"
        aws iam delete-role-policy \
            --role-name $ROLE_NAME \
            --policy-name $POLICY \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
    done
fi

aws iam delete-role \
    --role-name $ROLE_NAME \
    --region $AWS_REGION 2>&1 >/dev/null && echo "✅ EventBridge role deleted" || true

# Delete task role policies (try both old and new naming)
for ROLE_NAME in "scraper-task-role" "aligno-scraper-task-role"; do
    POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --region $AWS_REGION \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$POLICIES" ]; then
        for POLICY in $POLICIES; do
            echo "   Deleting policy $POLICY from $ROLE_NAME"
            aws iam delete-role-policy \
                --role-name $ROLE_NAME \
                --policy-name $POLICY \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
        done
    fi
    
    aws iam delete-role \
        --role-name $ROLE_NAME \
        --region $AWS_REGION 2>&1 >/dev/null && echo "✅ Task role $ROLE_NAME deleted" || true
done

# Delete execution role policies (try both old and new naming)
for ROLE_NAME in "scraper-execution-role" "aligno-scraper-execution-role"; do
    POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --region $AWS_REGION \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$POLICIES" ]; then
        for POLICY in $POLICIES; do
            echo "   Deleting policy $POLICY from $ROLE_NAME"
            aws iam delete-role-policy \
                --role-name $ROLE_NAME \
                --policy-name $POLICY \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
        done
    fi
    
    aws iam delete-role \
        --role-name $ROLE_NAME \
        --region $AWS_REGION 2>&1 >/dev/null && echo "✅ Execution role $ROLE_NAME deleted" || true
done

# 9. Get VPC ID (by tag or name)
echo ""
echo "🔍 Finding VPC and networking resources..."
VPC_ID=$(aws ec2 describe-vpcs \
    --region $AWS_REGION \
    --filters "Name=cidr,Values=10.0.0.0/16" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "")

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    echo "   No VPC found with CIDR 10.0.0.0/16"
    echo "✅ Cleanup completed!"
    exit 0
fi

echo "   Found VPC: $VPC_ID"

# 10. Delete security groups (except default)
echo ""
echo "🗑️  Deleting security groups..."

# First, find all custom security groups (non-default)
SECURITY_GROUPS=$(aws ec2 describe-security-groups \
    --region $AWS_REGION \
    --query 'SecurityGroups[?GroupName!=`default` && (contains(GroupName, `scraper`) || contains(GroupName, `aligno`))].GroupId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SECURITY_GROUPS" ]; then
    for SG_ID in $SECURITY_GROUPS; do
        echo "   Processing security group: $SG_ID"
        
        # Remove all ingress rules from other SGs that reference this SG
        echo "     Checking for references in other security groups..."
        aws ec2 describe-security-groups \
            --region $AWS_REGION \
            --output json 2>/dev/null | jq -r --arg sg "$SG_ID" \
            '.SecurityGroups[] | select(.IpPermissions[].UserIdGroupPairs[]?.GroupId == $sg or .IpPermissionsEgress[].UserIdGroupPairs[]?.GroupId == $sg) | .GroupId' | \
        while read REFERENCING_SG; do
            if [ ! -z "$REFERENCING_SG" ]; then
                echo "     Removing references from $REFERENCING_SG..."
                # Get the rules that reference our SG
                aws ec2 describe-security-groups \
                    --group-ids $REFERENCING_SG \
                    --region $AWS_REGION \
                    --output json 2>/dev/null | jq -r --arg sg "$SG_ID" \
                    '.SecurityGroups[].IpPermissions[] | select(.UserIdGroupPairs[]?.GroupId == $sg) | @json' | \
                while read RULE; do
                    if [ ! -z "$RULE" ]; then
                        aws ec2 revoke-security-group-ingress \
                            --group-id $REFERENCING_SG \
                            --region $AWS_REGION \
                            --ip-permissions "$RULE" 2>&1 >/dev/null || true
                    fi
                done
            fi
        done
        
        echo "     Deleting security group: $SG_ID"
        aws ec2 delete-security-group \
            --group-id $SG_ID \
            --region $AWS_REGION 2>&1 >/dev/null && echo "     ✅ Deleted" || echo "     Failed to delete"
    done
    echo "✅ Security groups processed"
else
    echo "   No custom security groups to delete"
fi

# 11. Delete subnets
echo ""
echo "🗑️  Deleting subnets..."
SUBNETS=$(aws ec2 describe-subnets \
    --region $AWS_REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].SubnetId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SUBNETS" ]; then
    for SUBNET_ID in $SUBNETS; do
        echo "   Deleting subnet: $SUBNET_ID"
        aws ec2 delete-subnet \
            --subnet-id $SUBNET_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Subnets deleted"
else
    echo "   No subnets to delete"
fi

# 12. Delete route tables (except main)
echo ""
echo "🗑️  Deleting route tables..."
ROUTE_TABLES=$(aws ec2 describe-route-tables \
    --region $AWS_REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ROUTE_TABLES" ]; then
    for RT_ID in $ROUTE_TABLES; do
        echo "   Deleting route table: $RT_ID"
        aws ec2 delete-route-table \
            --route-table-id $RT_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Route tables deleted"
else
    echo "   No route tables to delete"
fi

# 13. Detach and delete Internet Gateways
echo ""
echo "🗑️  Deleting Internet Gateways..."
IGW_IDS=$(aws ec2 describe-internet-gateways \
    --region $AWS_REGION \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query 'InternetGateways[].InternetGatewayId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$IGW_IDS" ]; then
    for IGW_ID in $IGW_IDS; do
        echo "   Detaching Internet Gateway: $IGW_ID"
        aws ec2 detach-internet-gateway \
            --internet-gateway-id $IGW_ID \
            --vpc-id $VPC_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to detach"
        
        echo "   Deleting Internet Gateway: $IGW_ID"
        aws ec2 delete-internet-gateway \
            --internet-gateway-id $IGW_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Internet Gateways deleted"
else
    echo "   No Internet Gateways to delete"
fi

# 14. Delete VPC
echo ""
echo "🗑️  Deleting VPC..."
aws ec2 delete-vpc \
    --vpc-id $VPC_ID \
    --region $AWS_REGION 2>&1 && echo "✅ VPC deleted" || echo "   Failed to delete VPC (may still have dependencies)"

echo ""
echo "✅ Cleanup completed!"
echo "📋 RDS database has been preserved"
echo ""
echo "💡 Note: If some resources couldn't be deleted, they may still be in use."
echo "   Wait a few minutes and run this script again."

