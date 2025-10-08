#!/bin/bash

# Quick deploy script - runs all necessary steps
set -e

echo "🚀 Quick Deploy - Aligno Scraper to AWS Fargate"
echo "================================================"
echo "Deployment Mode: Scheduled Task (daily at 2 AM UTC)"
echo "Estimated cost: ~\$18/month (Fargate + RDS)"
echo ""

# Check if we're in the deployment/scraper directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Please run this script from the deployment/scraper directory"
    exit 1
fi

# Make scripts executable
chmod +x setup-iam.sh setup-infrastructure.sh deploy.sh test-local.sh

echo ""
echo "📋 Deploy steps:"
echo "1. Setup IAM roles and policies"
echo "2. Setup AWS infrastructure (VPC, subnets, security groups)"
echo "3. Build and deploy Docker image to ECR"
echo "4. Setup scheduled task (runs daily at 2 AM UTC)"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelled."
    exit 1
fi

echo ""
echo "🔐 Step 1: Setting up IAM roles..."
./setup-iam.sh

echo ""
echo "🏗️ Step 2: Setting up infrastructure..."
./setup-infrastructure.sh

echo ""
echo "✅ Infrastructure setup completed!"
echo "ℹ️  The deploy script will automatically detect and use the network configuration."
echo ""
read -p "Press Enter to continue with deployment..."

echo ""
echo "🚀 Step 3: Deploying application..."
./deploy.sh

echo ""
echo "🎉 Quick deploy completed successfully!"
