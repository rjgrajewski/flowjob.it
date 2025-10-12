# Scout - JustJoin.it Job Scraper

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue)

## 🎯 Overview

Scout is an intelligent, asynchronous web scraper that automatically collects IT job offers from JustJoin.it, one of Poland's leading IT job boards, extracting key details from each listing and storing them in a PostgreSQL database for up-to-date, structured job market analysis.

### Key Features

- 🤖 **Automated Scraping**: Fully automated collection of job offers
- 🔄 **Smart Synchronization**: Automatically detects new offers and removes stale ones
- 🔒 **AWS Integration**: Supports direct connection with PostgreSQL/AWS RDS and AWS Secrets Manager for secure credential management

## 🔍 How Scout Works

### 1. Link Collection Phase

Scrolling algorithm:

- Scrolls down the page progressively
- Collects unique job offer links after each scroll (the page performs dynamic loading)
- Stops when no new links found for `MAX_IDLE_SCROLLS` consecutive scrolls
- Prevents duplicates using set-based tracking

### 2. Data Extraction Phase

For each new offer URL, Scout navigates to the individual offer page and extracts structured data fields (such as job title, company, and location) by applying dedicated selectors for each data point. The extracted information is then saved into the database as a new entry in the `offers` table.

### 3. Cleanup Phase

After data extraction, Scout performs cleanup actions to maintain data quality. It detects and removes stale offers that are no longer listed on the website, cleans up any empty records resulting from failed extractions, and then gracefully closes all active connections and resources, including the database connection and browser instance.

## 🏗️ Architecture

```
scout/
├── __main__.py         # Entry point for running as module
├── cli.py              # Main orchestration and CLI interface
├── config.py           # Configuration constants
├── db.py               # Database connection and operations
├── scrape_core.py      # Core scraping logic
├── selectors.py        # CSS/XPath selectors configuration
└── aws_secrets.py      # AWS Secrets Manager integration
```

### Async Architecture

Scout uses **async/await syntax** required by Playwright for browser automation. Database operations use `asyncpg` for **non-blocking I/O**.

**Important:** Job offers are processed **sequentially,** not in parallel. This is intentional for:
- **Rate limiting** - respectful scraping without overwhelming the target site
- **Browser limitations** - single Playwright page instance
- **Memory control** - predictable resource usage
- **Error tracking** - easier debugging of sequential flow

### AWS Fargate

- **ECS Cluster** with Fargate task (serverless container execution)
- **EventBridge** rule for scheduling (daily at 2 AM UTC)
- **CloudWatch Logs** for monitoring and debugging
- **Secrets Manager** for secure credential storage
- **RDS PostgreSQL** for data storage
- **IAM Roles** for service authentication

## 📦 Dependencies

Scout uses the following key dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `playwright` | 1.52.0 | Browser automation for web scraping |
| `asyncpg` | 0.29.0 | Async PostgreSQL database driver |
| `boto3` | 1.35.0 | AWS SDK for Secrets Manager integration |
| `python-dotenv` | 1.0.0 | Environment variable management |

For the complete list, see `requirements.txt` in the project root.

## ⚙️ Configuration

Scout's behavior can be customized through `config.py`:

```python
class ScrapingConfig:
    # Browser settings
    HEADLESS = True                    # Run browser in headless mode (set False for debugging)
    RESTART_BROWSER_EVERY = 500        # Restart browser every N offers (memory management)
    
    # Scraping behavior
    SCROLL_PAUSE_TIME = 0.05           # Pause between scrolls (seconds)
    MAX_IDLE_SCROLLS = 100             # Stop after N scrolls without new links
    
    # Timeouts
    LINK_TIMEOUT = 2000                # Timeout for link extraction (ms)
    PAGE_LOAD_TIMEOUT = 60000          # Timeout for page loading (ms)
    REQUEST_DELAY = 0.5                # Delay between processing offers (seconds)
```

### Selectors

Scout uses centralized selector management through `selectors.py`:

```python
class JustJoinItSelectors:
    JOB_OFFER_LINKS = SelectorConfig(
        primary='a[href*="/job-offer/"]',
        description="Links to individual job offers"
    )
    
    JOB_TITLE = SelectorConfig(
        primary='h1',
        description="Main job title heading"
    )
    
    COMPANY = SelectorConfig(
        primary='a:has(svg[data-testid="ApartmentRoundedIcon"]) p',
        description="Company name from link with apartment icon"
    )
    
    # ... more selectors
```

**Selector types:**
- CSS selectors for simple elements
- XPath expressions for complex DOM navigation
- Text-based selectors for dynamic content

## 🚀 Installation

### Prerequisites

- Python 3.9+
- PostgreSQL 15.3+ (or AWS RDS)
- pip and virtualenv

### Local Setup

> **Note:**
> For AWS deployment, skip local setup and use `quick-deploy.sh` (see Deployment section below).

1. **Install dependencies:**

```bash
# From project root
pip install -r requirements.txt
```

2. **Install Playwright browsers:**

```bash
playwright install chromium
```

3. **Configure environment:**

Create a `.env` file in the project root:

```bash
# Database Configuration (AWS RDS)
AWS_DB_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_DB_NAME=aligno-db
AWS_DB_USERNAME=your_username
AWS_DB_PASSWORD=your_password
AWS_REGION=eu-central-1

# Optional: AWS Secrets Manager (for production)
SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name
```

## 📖 Usage

### AWS Fargate (Production)

**Quick Deployment:**
```bash
cd aws/deployment/scout
./quick-deploy.sh
```

**Management Commands:**
```bash
# Run task manually (outside schedule)
./management-commands.sh run-now

# View recent logs
./management-commands.sh logs

# Enable scheduled scraping
./management-commands.sh enable-schedule

# Disable scheduled scraping
./management-commands.sh disable-schedule

# Check task status
./management-commands.sh status
```

**Required AWS Permissions:**
The deployment requires the following IAM permissions:
- `ecs:*` - ECS task management
- `ecr:*` - Container registry operations
- `events:*` - EventBridge scheduling
- `logs:*` - CloudWatch Logs access
- `secretsmanager:GetSecretValue` - Access to RDS credentials
- `rds:DescribeDBInstances` - Database connection info
- `iam:PassRole` - Service role assignment

For detailed deployment instructions, see [AWS Deployment Guide](../../aws/deployment/scout/README.md).

### Local Execution

**As a Python module (recommended):**

```bash
python -m scout
```

**From project root:**

```bash
cd src
python -m scout
```

**Direct execution:**

```bash
python src/scout/__main__.py
```

## 🗄️ Database Schema

Scout automatically creates and manages the `offers` table:

```sql
CREATE TABLE IF NOT EXISTS offers (
    job_url TEXT PRIMARY KEY,
    job_title TEXT,
    category TEXT,
    company TEXT,
    location TEXT,
    salary_any TEXT,
    salary_b2b TEXT,
    salary_internship TEXT,
    salary_mandate TEXT,
    salary_permanent TEXT,
    salary_specific_task TEXT,
    work_schedule TEXT,
    experience TEXT,
    employment_type TEXT,
    operating_mode TEXT,
    tech_stack TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Security Features

### AWS Secrets Manager Integration

```python
# Automatically loads credentials from AWS Secrets Manager
SECRET_ARN = os.getenv('SECRET_ARN')
if SECRET_ARN:
    setup_database_credentials_from_secrets(SECRET_ARN)
```

### Data Sanitization

```python
def sanitize_string(value, max_length=None):
    """Simple string sanitization without validation."""
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned if cleaned else None
```

### Memory Management

Scout implements automatic browser restarts to prevent memory leaks:

```python
# Restart browser every 500 offers (configurable)
if i > 1 and (i - 1) % ScrapingConfig.RESTART_BROWSER_EVERY == 0:
    await browser.close()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
```

## 📊 Performance Considerations

### Typical execution statistics

**Typical execution statistics:**
- **Offers collected:** ~7.000 per run
- **Execution time:** ~1 hour
- **Database operations:** ~300 inserts (new offers), ~100 deletes (stale offers)

## 📈 Monitoring

### Logs

Scout provides detailed logging:

```
2025-10-11 12:00:00 [INFO] ✅ Database connection established successfully
2025-10-11 12:00:01 [INFO] 🔄 Starting to collect job offer links...
2025-10-11 12:00:15 [INFO] 📊 Collected 1250 unique job offer links
2025-10-11 12:00:16 [INFO] 🛑 Stopping - no new links found
2025-10-11 12:00:16 [INFO] ⏭️ Already in database: 1100 offers
2025-10-11 12:00:16 [INFO] 🆕 New offers to process: 150 offers
2025-10-11 12:15:30 [INFO] ✅ Processed 150 new offers
2025-10-11 12:15:31 [INFO] 🗑️ Purged 45 stale offers
2025-10-11 12:15:31 [INFO] 🎉 Scraping completed successfully!
```

### CloudWatch Logs (AWS)

```bash
# View recent logs
./management-commands.sh logs

# Stream logs in real-time
aws logs tail /aws/ecs/scout-scraper --follow
```

## 📝 Future Improvements

- [ ] Support for additional job portals (No Fluff Jobs, theprotocol.it)
- [ ] Parallel processing of offers
- [ ] Machine learning for selector auto-update detection

## 🔗 Related Documentation

- [Aligno Main README](../../README.md) - Project overview and architecture
- [AWS Deployment Guide](../../aws/deployment/scout/README.md) - Detailed AWS setup and deployment

---

**Proudly built and maintained by Rafal Grajewski for the Aligno project**