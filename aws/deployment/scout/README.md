# Aligno Scout - AWS Fargate Deployment

Complete deployment guide for running Aligno Scout (job offers module) as a **scheduled task on AWS Fargate** (daily at 2 AM UTC).

---

## 📁 Architecture

```
aws/deployment/scout/
├── Dockerfile                    # Docker image for Scout
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

## 💰 Cost Estimation

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **RDS** | db.t4g.micro, 20 GB storage | ~$14.80 |
| **Fargate** | 1 vCPU, 2 GB RAM, ~30 runs × 30 min | ~$2.40 |
| **ECR** | ~500 MB image storage | ~$0.05 |
| **CloudWatch Logs** | ~1 GB/month | ~$0.50 |
| **EventBridge** | Scheduled rules | $0.00 |
| **Secrets Manager** | 1 secret | ~$0.40 |
| **TOTAL** | | **~$18.15/month** |

---

## 📚 Additional Resources

- [Aligno README](../../../README.md)
- [Scout README](../scout/README.md)

---

**Proudly built and maintained by Rafal Grajewski for the Aligno project**