#!/bin/bash

# Test script for local Docker build and execution
set -e

echo "🧪 Testing flowjob Scout locally with Docker..."
echo ""

# Detect platform
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo "📱 Detected ARM64 architecture (Apple Silicon)"
    echo "   Building for linux/amd64 (AWS Fargate compatibility)"
    echo ""
fi

# Check if .env exists
if [ ! -f "../../.env" ]; then
    echo "⚠️  .env file not found in project root"
    echo "   Running basic Docker build test only..."
    echo ""
    BASIC_TEST=true
else
    echo "✅ Found .env file - will run full test with real database"
    echo ""
    BASIC_TEST=false
    
    # Load environment variables
    export $(grep -v '^#' ../../.env | grep -v '^$' | xargs)
fi

# Build Docker image
echo "🔨 Building Docker image for linux/amd64 (AWS Fargate platform)..."
docker build --platform linux/amd64 -t scout-test -f Dockerfile ../..

echo "✅ Docker image built successfully"
echo ""

# Test 1: Basic container startup
echo "🚀 Test 1: Container startup..."
docker run --rm scout-test python --version
echo "✅ Python works in container"
echo ""

# Test 2: Check if dependencies are installed
echo "📦 Test 2: Checking dependencies..."
docker run --rm scout-test python -c "import asyncpg, playwright, pydantic; print('✅ All main dependencies installed')"
echo ""

if [ "$BASIC_TEST" = false ]; then
    # Test 3: Full Scout run with real database
    echo "🌐 Test 3: Running Scout with real database..."
    echo "   This will actually scrape JustJoin.it and update your database!"
    echo ""
    read -p "   Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🏃 Running Scout..."
        
        docker run --rm \
            -e AWS_DB_ENDPOINT="$AWS_DB_ENDPOINT" \
            -e AWS_DB_NAME="$AWS_DB_NAME" \
            -e AWS_DB_USERNAME="$AWS_DB_USERNAME" \
            -e AWS_DB_PASSWORD="$AWS_DB_PASSWORD" \
            -e AWS_REGION="$AWS_REGION" \
            -e SECRET_ARN="$SECRET_ARN" \
            scout-test
        
        echo ""
        echo "✅ Scout completed successfully!"
    else
        echo ""
        echo "⏭️  Skipped full Scout run"
    fi
else
    echo "💡 To run full test with database:"
    echo "   1. Create .env file in project root (copy from .env.example)"
    echo "   2. Fill in your database credentials"
    echo "   3. Run this script again"
    echo ""
    echo "   Or run manually:"
    echo "   docker run --rm \\"
    echo "     -e AWS_DB_ENDPOINT=your-endpoint \\"
    echo "     -e AWS_DB_USERNAME=your-username \\"
    echo "     -e AWS_DB_PASSWORD=your-password \\"
    echo "     -e AWS_DB_NAME=your-db \\"
    echo "     scout-test"
fi

echo ""
echo "=========================================="
echo "✅ Docker test completed!"
echo "=========================================="
echo ""
echo "📋 What was tested:"
if [ "$BASIC_TEST" = true ]; then
    echo "   ✅ Docker image builds successfully"
    echo "   ✅ Python environment works"
    echo "   ✅ Dependencies are installed"
    echo "   ⏭️  Skipped: Full Scout run (no .env)"
else
    echo "   ✅ Docker image builds successfully"
    echo "   ✅ Python environment works"
    echo "   ✅ Dependencies are installed"
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   ✅ Full Scout run completed"
    else
        echo "   ⏭️  Skipped: Full Scout run (user choice)"
    fi
fi
echo ""
echo "🎯 Next steps:"
echo "   - If test passed, you're ready to deploy: ./quick-deploy.sh"
echo "   - To run locally again: docker run --env-file ../../.env scout-test"
echo ""
