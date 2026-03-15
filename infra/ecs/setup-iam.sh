#!/bin/bash

# Setup IAM roles and policies for flowjob Scout
set -e

# Load environment variables from .env file
if [ -f "../../.env" ]; then
    echo "📝 Loading configuration from .env..."
    # disabled
else
    echo "⚠️  .env file not found. Using default values or environment variables."
fi

# Configuration (use env vars or defaults)
AWS_REGION="${AWS_REGION:-eu-central-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID must be set in .env file}"
SECRET_ARN="${SECRET_ARN:?SECRET_ARN must be set in .env file}"

echo "🔐 Setting up IAM roles and policies for flowjob Scout..."
echo "   AWS Account: ${AWS_ACCOUNT_ID}"
echo "   Region: ${AWS_REGION}"

# Create task role policy document (with Secrets Manager access)
cat > task-role-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "${SECRET_ARN}"
        }
    ]
}
EOF

# Create task role
echo "📝 Creating task role..."
aws iam create-role \
    --role-name scout-task-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region $AWS_REGION 2>/dev/null || echo "Role already exists"

# Attach policy to task role
echo "📋 Attaching policy to task role..."
aws iam put-role-policy \
    --role-name scout-task-role \
    --policy-name ScoutSecretsPolicy \
    --policy-document file://task-role-policy.json \
    --region $AWS_REGION

# Create execution role policy document
cat > execution-role-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Create execution role
echo "📝 Creating execution role..."
aws iam create-role \
    --role-name scout-execution-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region $AWS_REGION 2>/dev/null || echo "Role already exists"

# Attach policy to execution role
echo "📋 Attaching policy to execution role..."
aws iam put-role-policy \
    --role-name scout-execution-role \
    --policy-name ScoutExecutionPolicy \
    --policy-document file://execution-role-policy.json \
    --region $AWS_REGION

# Clean up temporary files
rm -f task-role-policy.json execution-role-policy.json

echo "✅ IAM roles and policies created successfully!"
echo "📋 Created roles:"
echo "   - scout-task-role"
echo "   - scout-execution-role"
