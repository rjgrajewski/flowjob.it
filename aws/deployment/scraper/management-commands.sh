#!/bin/bash

# Management commands for Aligno Scraper Scheduled Task
# Usage: ./management-commands.sh [command]

# Load environment variables
if [ -f "../../../.env" ]; then
    export $(grep -v '^#' ../../../.env | grep -v '^$' | xargs)
fi

AWS_REGION="${AWS_REGION:-eu-central-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECS_CLUSTER="scraper-cluster"
TASK_DEFINITION="scraper"
SCHEDULE_RULE="scraper-daily-schedule"

case "$1" in
    "logs")
        echo "📋 Showing recent logs..."
        aws logs tail /ecs/scraper --follow --region $AWS_REGION
        ;;
    "schedule-status")
        echo "📊 Schedule status..."
        aws events describe-rule --name $SCHEDULE_RULE --region $AWS_REGION
        ;;
    "tasks")
        echo "📋 Recently run tasks..."
        aws ecs list-tasks --cluster $ECS_CLUSTER --region $AWS_REGION
        ;;
    "task-status")
        echo "📊 Task details..."
        TASK_ARN=$(aws ecs list-tasks --cluster $ECS_CLUSTER --region $AWS_REGION --query 'taskArns[0]' --output text)
        if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
            aws ecs describe-tasks --cluster $ECS_CLUSTER --tasks $TASK_ARN --region $AWS_REGION
        else
            echo "No tasks currently running"
        fi
        ;;
    "run-now")
        echo "🚀 Running task manually (outside schedule)..."
        # Get network configuration
        VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text 2>/dev/null || \
                 aws ec2 describe-vpcs --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text)
        SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'Subnets[0].SubnetId' --output text)
        SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=scraper-sg" "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)
        
        aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition $TASK_DEFINITION \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
            --region $AWS_REGION
        echo "✅ Task started manually"
        ;;
    "disable-schedule")
        echo "🛑 Disabling scheduled runs..."
        aws events disable-rule --name $SCHEDULE_RULE --region $AWS_REGION
        echo "✅ Schedule disabled (won't run automatically)"
        ;;
    "enable-schedule")
        echo "▶️ Enabling scheduled runs..."
        aws events enable-rule --name $SCHEDULE_RULE --region $AWS_REGION
        echo "✅ Schedule enabled (will run daily at 2 AM UTC)"
        ;;
    "stop-running")
        echo "🛑 Stopping currently running tasks..."
        TASK_ARNS=$(aws ecs list-tasks --cluster $ECS_CLUSTER --region $AWS_REGION --query 'taskArns[]' --output text)
        if [ ! -z "$TASK_ARNS" ]; then
            for TASK_ARN in $TASK_ARNS; do
                echo "Stopping task: $TASK_ARN"
                aws ecs stop-task --cluster $ECS_CLUSTER --task $TASK_ARN --region $AWS_REGION
            done
            echo "✅ Tasks stopped"
        else
            echo "No tasks currently running"
        fi
        ;;
    "update-schedule")
        if [ -z "$2" ]; then
            echo "❌ Please provide cron expression"
            echo "Example: ./management-commands.sh update-schedule 'cron(0 3 * * ? *)'"
            echo "Current schedule: cron(0 2 * * ? *) - daily at 2 AM UTC"
            exit 1
        fi
        echo "⏰ Updating schedule to: $2"
        aws events put-rule \
            --name $SCHEDULE_RULE \
            --schedule-expression "$2" \
            --region $AWS_REGION
        echo "✅ Schedule updated"
        ;;
    *)
        echo "🔧 Aligno Scraper Management Commands (Scheduled Task)"
        echo "======================================================"
        echo ""
        echo "Usage: ./management-commands.sh [command]"
        echo ""
        echo "Available commands:"
        echo "  logs              - Show and follow application logs"
        echo "  schedule-status   - Show schedule rule status"
        echo "  tasks             - List recently run tasks"
        echo "  task-status       - Show details of latest task"
        echo "  run-now           - Run task manually (outside schedule)"
        echo "  disable-schedule  - Disable automatic daily runs"
        echo "  enable-schedule   - Enable automatic daily runs"
        echo "  stop-running      - Stop currently running tasks"
        echo "  update-schedule   - Update schedule cron expression"
        echo ""
        echo "Examples:"
        echo "  ./management-commands.sh logs"
        echo "  ./management-commands.sh run-now"
        echo "  ./management-commands.sh disable-schedule"
        echo "  ./management-commands.sh update-schedule 'cron(0 3 * * ? *)'"
        echo ""
        echo "Current schedule: Daily at 2 AM UTC (cron: 0 2 * * ? *)"
        ;;
esac
