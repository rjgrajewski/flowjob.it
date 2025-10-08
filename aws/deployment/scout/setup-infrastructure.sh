#!/bin/bash

# Setup AWS infrastructure for Aligno Scout
set -e

AWS_REGION="eu-central-1"
VPC_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"

echo "🏗️ Setting up AWS infrastructure for Aligno Scraper..."

# Create VPC
echo "🌐 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block $VPC_CIDR \
    --region $AWS_REGION \
    --query 'Vpc.VpcId' \
    --output text)

echo "✅ VPC created: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
    --vpc-id $VPC_ID \
    --enable-dns-hostnames \
    --region $AWS_REGION

# Create Internet Gateway
echo "🌍 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --region $AWS_REGION \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

echo "✅ Internet Gateway created: $IGW_ID"

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID \
    --region $AWS_REGION

# Create public subnet
echo "🏠 Creating public subnet..."
SUBNET_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $SUBNET_CIDR \
    --availability-zone ${AWS_REGION}a \
    --region $AWS_REGION \
    --query 'Subnet.SubnetId' \
    --output text)

echo "✅ Subnet created: $SUBNET_ID"

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute \
    --subnet-id $SUBNET_ID \
    --map-public-ip-on-launch \
    --region $AWS_REGION

# Create route table
echo "🛣️ Creating route table..."
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --query 'RouteTable.RouteTableId' \
    --output text)

echo "✅ Route table created: $ROUTE_TABLE_ID"

# Associate subnet with route table
aws ec2 associate-route-table \
    --subnet-id $SUBNET_ID \
    --route-table-id $ROUTE_TABLE_ID \
    --region $AWS_REGION

# Create route to Internet Gateway
aws ec2 create-route \
    --route-table-id $ROUTE_TABLE_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID \
    --region $AWS_REGION

# Create security group
echo "🔒 Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name scout-sg \
    --description "Security group for Scraper" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --query 'GroupId' \
    --output text)

echo "✅ Security group created: $SECURITY_GROUP_ID"

# Allow outbound HTTPS traffic
aws ec2 authorize-security-group-egress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Allow outbound HTTP traffic
aws ec2 authorize-security-group-egress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Allow outbound PostgreSQL traffic
aws ec2 authorize-security-group-egress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

echo "✅ Infrastructure setup completed!"
echo "📋 Created resources:"
echo "   - VPC: $VPC_ID"
echo "   - Internet Gateway: $IGW_ID"
echo "   - Subnet: $SUBNET_ID"
echo "   - Route Table: $ROUTE_TABLE_ID"
echo "   - Security Group: $SECURITY_GROUP_ID"
echo ""
echo "🔧 Update your ecs-task-definition.json with:"
echo "   - subnet-ids: $SUBNET_ID"
echo "   - security-group-ids: $SECURITY_GROUP_ID"
