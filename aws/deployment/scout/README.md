# Aligno Scout - AWS Fargate Deployment

Complete deployment guide for running Aligno Scout (job scraper module) as a **scheduled task on AWS Fargate** (daily at 2 AM UTC).

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [File Structure](#-file-structure)
- [First-Time Setup](#-first-time-setup)
- [Updating Code](#-updating-code)
- [Management Commands](#-management-commands)
- [Configuration Details](#-configuration-details)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)
- [Cost Estimation](#-cost-estimation)
- [Security](#-security)

---

## 🚀 Quick Start

### Already have infrastructure set up?

**Update code:**
```bash
cd aws/deployment/scout
./deploy.sh
```

**Test locally:**
```bash
./test-local.sh
```

### First time deploying?

**Full setup (infrastructure + app):**
```bash
cd aws/deployment/scout
./quick-deploy.sh
```

This will:
1. Create IAM roles
2. Set up VPC, subnets, security groups
3. Create ECR repository
4. Build and push Docker image
5. Create ECS cluster and scheduled task

---

## 📋 Prerequisites

Before deploying, ensure you have:

### Required Tools
- ✅ **AWS CLI** configured with appropriate permissions
- ✅ **Docker** installed with multi-platform build support
- ✅ **AWS RDS PostgreSQL** instance running and accessible

### Required AWS Resources
- ✅ **AWS Secrets Manager** secret containing database credentials:
  ```json
  {
    "username": "your_db_username",
    "password": "your_db_password"
  }
  ```
  
  Create with:
  ```bash
  aws secretsmanager create-secret \
    --name aligno-db-credentials \
    --secret-string '{"username":"your_user","password":"your_password"}' \
    --region eu-central-1
  ```

### Required Configuration File

Create `.env` file in the **project root** (`Aligno/.env`) with:

```bash
# AWS Account Configuration
AWS_ACCOUNT_ID=123456789012
AWS_REGION=eu-central-1

# Secrets Manager
SECRET_ARN=arn:aws:secretsmanager:eu-central-1:123456789012:secret:aligno-db-credentials-xxxxxx

# Database Configuration (non-sensitive)
AWS_DB_ENDPOINT=your-rds-endpoint.rds.amazonaws.com
AWS_DB_NAME=aligno_db

# Local Development Fallback (if Secrets Manager fails)
AWS_DB_USERNAME=your_username
AWS_DB_PASSWORD=your_password
```

**Note:** Copy from `.env.example` and fill in your values.

### IAM Permissions

Your AWS user/role needs permissions to create:
- ECS clusters, services, tasks, task definitions
- ECR repositories
- IAM roles and policies
- VPC, subnets, security groups, internet gateways
- CloudWatch log groups
- EventBridge rules
- Access to Secrets Manager

---

## 📁 File Structure

```
aws/deployment/scout/
├── Dockerfile                    # Docker image for scraper
├── .dockerignore                 # Files ignored by Docker build
├── ecs-task-definition.json.template  # ECS task definition template
├── deploy.sh                     # Main deployment script (update code)
├── quick-deploy.sh               # Full setup (infrastructure + app)
├── setup-iam.sh                  # IAM roles creation
├── setup-infrastructure.sh       # VPC, subnets, security groups
├── test-local.sh                 # Local Docker testing
├── management-commands.sh        # Service management utilities
└── README.md                     # This file
```

---

## 🛠 First-Time Setup

### Step 1: Prepare Configuration

1. **Create Secrets Manager secret** (see [Prerequisites](#-prerequisites))
2. **Create `.env` file** in project root with your AWS configuration
3. **Ensure RDS database exists** and is accessible

### Step 2: Run Full Deployment

```bash
cd aws/deployment/scout
chmod +x *.sh
./quick-deploy.sh
```

This script will:
1. ✅ Create IAM execution and task roles
2. ✅ Set up VPC and networking (or use existing default VPC)
3. ✅ Create security group with required rules
4. ✅ Create ECR repository
5. ✅ Build Docker image for **linux/amd64** platform
6. ✅ Push image to ECR
7. ✅ Create ECS cluster `scout-cluster`
8. ✅ Register task definition
9. ✅ Create EventBridge scheduled rule (cron: `0 2 * * ? *` = 2 AM UTC daily)

### Step 3: Verify Deployment

```bash
# Check scheduled rule status
./management-commands.sh schedule-status

# View recent logs
./management-commands.sh logs

# Run task manually (optional)
./management-commands.sh run-now
```

---

## 🔄 Updating Code

After making code changes in `src/scout/`, deploy the update:

```bash
cd aws/deployment/scout
./deploy.sh
```

This will:
1. Build new Docker image
2. Push to ECR
3. Register new task definition revision
4. Update EventBridge rule to use new revision

**Note:** The next scheduled run (or manual run) will use the new code.

---

## 🎛 Management Commands

Use `management-commands.sh` for common operations:

### View Logs
```bash
./management-commands.sh logs
```
Shows recent CloudWatch logs from Scout.

### Check Schedule Status
```bash
./management-commands.sh schedule-status
```
Shows EventBridge rule state (ENABLED/DISABLED) and schedule.

### Run Task Manually
```bash
./management-commands.sh run-now
```
Triggers Scout immediately (outside of schedule).

### Stop Running Task
```bash
./management-commands.sh stop-running
```
Stops currently running Scout task.

### Enable/Disable Schedule
```bash
./management-commands.sh enable-schedule
./management-commands.sh disable-schedule
```
Enable or disable automatic daily runs.

### Update Schedule
```bash
./management-commands.sh update-schedule 'cron(0 3 * * ? *)'
```
Change schedule (example: 3 AM UTC).

---

## ⚙️ Configuration Details

### Deployment Architecture

Scout runs as a **Fargate Scheduled Task**:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  EventBridge │─────▶│   Fargate    │─────▶│   RDS DB     │
│  (2 AM UTC)  │      │     Scout    │      │  (offers)    │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Secrets    │
                      │   Manager    │
                      └──────────────┘
```

### Network Configuration

Scripts automatically handle networking:

- **VPC**: Uses default VPC or first available
- **Subnet**: Public subnet with internet access (auto-detected)
- **Security Group**: `scout-sg` with rules for:
  - ✅ HTTPS (443) outbound - for web scraping
  - ✅ HTTP (80) outbound - for redirects
  - ✅ PostgreSQL (5432) outbound - for RDS connection

**Note:** Network configuration is NOT in `ecs-task-definition.json` - it's applied when creating the scheduled rule.

### Environment Variables

Scout uses a **hybrid configuration approach**:

#### In ECS Task Definition
```json
{
  "AWS_REGION": "eu-central-1",
  "SECRET_ARN": "arn:aws:secretsmanager:...",
  "AWS_DB_ENDPOINT": "your-endpoint.rds.amazonaws.com",
  "AWS_DB_NAME": "aligno_db"
}
```

Values are auto-populated from `.env` during deployment.

#### Security Model
- 🔐 **Sensitive data (username, password)**: AWS Secrets Manager
- 📝 **Non-sensitive data (endpoint, db name)**: Environment variables
- 🔄 **Fallback**: `.env` file for local development

This ensures:
- ✅ Production credentials never in code/env vars
- ✅ Easy local development with `.env`
- ✅ Simple configuration for non-sensitive settings

### Platform Compatibility

Docker images are built for **linux/amd64** (AWS Fargate architecture):

- ✅ **Apple Silicon (M1/M2/M3)**: Cross-compiles automatically
- ✅ **Intel Mac**: Native build
- ✅ **Linux AMD64**: Native build
- ✅ **Linux ARM64**: Cross-compiles automatically

Build command uses: `docker buildx build --platform linux/amd64`

---

## 📈 Monitoring

### CloudWatch Logs

Logs are sent to: `/ecs/scout`

**View in real-time:**
```bash
aws logs tail /ecs/scout --follow --region eu-central-1
```

Or use management command:
```bash
./management-commands.sh logs
```

### ECS Console

Monitor task execution in AWS Console:
- **Cluster**: `scout-cluster`
- **Task Definition**: `scout`
- **Scheduled Rule**: `scout-daily-schedule`

Navigate to: ECS → Clusters → scout-cluster → Scheduled Tasks

---

## 🐛 Troubleshooting

### Task Not Running

**Check schedule status:**
```bash
./management-commands.sh schedule-status
```

**Verify EventBridge rule:**
```bash
aws events list-rules --name-prefix scout --region eu-central-1
```

**Check for failed tasks:**
```bash
aws ecs describe-tasks \
  --cluster scout-cluster \
  --tasks $(aws ecs list-tasks --cluster scout-cluster --query 'taskArns[0]' --output text) \
  --region eu-central-1
```

### Container Fails to Start

**Check logs:**
```bash
./management-commands.sh logs
```

**Common issues:**
- ❌ Secrets Manager ARN incorrect → verify `SECRET_ARN` in `.env`
- ❌ Database unreachable → check RDS security group allows connections
- ❌ Missing environment variables → verify task definition

### Database Connection Errors

**Verify RDS accessibility:**
```bash
# From local machine (if security group allows)
psql -h your-endpoint.rds.amazonaws.com -U your_user -d aligno_db
```

**Check security group rules:**
- RDS security group must allow inbound PostgreSQL (5432) from Scout security group
- Scout security group must allow outbound PostgreSQL (5432)

### Image Build Fails

**Platform issues:**
```bash
# Verify Docker buildx is available
docker buildx version

# Create builder if needed
docker buildx create --use
```

**Build manually to debug:**
```bash
cd ../../..  # Navigate to project root
docker buildx build \
  --platform linux/amd64 \
  -f aws/deployment/scout/Dockerfile \
  -t aligno-scout-test \
  .
```

### Secrets Manager Access Denied

**Verify IAM task role has permission:**
```bash
aws iam get-role-policy \
  --role-name ecsTaskRole \
  --policy-name SecretsManagerAccess \
  --region eu-central-1
```

Should include:
```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:*:*:secret:*"
}
```

---

## 💰 Cost Estimation

### Scheduled Task Mode (Current Configuration)

Running **once daily at 2 AM UTC** for ~15-30 minutes:

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **RDS** | db.t4g.micro, 20 GB storage | ~$14.80 |
| **Fargate** | 1 vCPU, 2 GB RAM, ~30 runs × 30 min | ~$2.40 |
| **ECR** | ~500 MB image storage | ~$0.05 |
| **CloudWatch Logs** | ~1 GB/month | ~$0.50 |
| **EventBridge** | Scheduled rules | $0.00 |
| **Secrets Manager** | 1 secret | ~$0.40 |
| **TOTAL** | | **~$18.15/month** |

### Cost Savings vs 24/7 Service

- 24/7 Service: ~$74/month (Fargate: ~$59, RDS: ~$15)
- Scheduled Task: ~$18/month
- **Savings: ~$56/month (76% reduction!)**

### Cost Optimization Tips

1. **Reduce task resources** if scraping is fast:
   - Current: 1 vCPU, 2 GB RAM
   - Minimum: 0.25 vCPU, 0.5 GB RAM (~$0.60/month for Fargate)

2. **Use RDS snapshots** for development:
   - Delete RDS instance when not needed
   - Restore from snapshot when needed
   - Snapshot storage: ~$0.095/GB/month

3. **CloudWatch Logs retention**:
   - Set retention to 7 days (default: indefinite)
   - Reduces storage costs

---

## 🔒 Security

### IAM Roles

**Task Execution Role** (`ecsTaskExecutionRole`):
- Pull images from ECR
- Write logs to CloudWatch
- **Principle**: Minimal permissions for ECS service

**Task Role** (`ecsTaskRole`):
- Access Secrets Manager for DB credentials
- **Principle**: Only what the application needs

### Network Security

- ✅ No public IP exposure (task runs in VPC)
- ✅ Security groups restrict traffic to HTTPS, HTTP, PostgreSQL
- ✅ RDS in private subnet (recommended)

### Secrets Management

- ✅ Database credentials in AWS Secrets Manager
- ✅ No secrets in environment variables
- ✅ No secrets in Docker image
- ✅ Secrets encrypted at rest (AWS managed keys)

### Container Security

- ✅ Non-root user in Dockerfile
- ✅ Multi-stage build (smaller attack surface)
- ✅ Only necessary dependencies installed

---

## 📚 Additional Resources

- **Main Project README**: `../../../README.md`
- **Cleanup Guide**: `../../cleanup/scout/README.md`
- **AWS Documentation**: `../../README.md`

---

## 🆘 Need Help?

1. Check [Troubleshooting](#-troubleshooting) section
2. Review CloudWatch logs: `./management-commands.sh logs`
3. Verify configuration in `.env` file
4. Check AWS Console for service status

---

**Last Updated**: Based on Scout module with Playwright 1.52.0, Python 3.9, asyncpg 0.29.0
