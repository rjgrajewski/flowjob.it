# Scout - JustJoin.it Job Scraper

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue)

Scout is an intelligent web scraper designed to collect job offers from JustJoin.it and store them in a PostgreSQL database. Built with Playwright for robust browser automation and asyncpg for non-blocking database I/O.

## 🎯 Overview

Scout automates the process of gathering job market data from JustJoin.it, one of Poland's leading IT job boards. It intelligently scrolls through job listings, extracts detailed information about each offer, and maintains a synchronized database of current job opportunities.

### Key Features

- 🤖 **Automated Scraping**: Fully automated collection of job offers with intelligent scrolling
- 🔄 **Smart Synchronization**: Automatically detects new offers and removes stale ones
- 💾 **Database Integration**: Direct integration with PostgreSQL/AWS RDS
- 🧹 **Memory Management**: Automatic browser restarts to prevent memory leaks
- 🔒 **AWS Integration**: Supports AWS Secrets Manager for secure credential management
- 📊 **Rich Data Extraction**: Collects comprehensive job details including tech stack, salary ranges, and more
- ⚙️ **Configurable**: Extensive configuration options for scraping behavior

### ⚡ Async Architecture

Scout uses **async/await syntax** required by Playwright for browser automation. Database operations use `asyncpg` for **non-blocking I/O**.

**Important:** Job offers are processed **sequentially,** not in parallel. This is intentional for:
- **Rate limiting** - respectful scraping without overwhelming the target site
- **Browser limitations** - single Playwright page instance
- **Memory control** - predictable resource usage
- **Error tracking** - easier debugging of sequential flow

## 📦 What Scout Collects

For each job offer, Scout extracts:

- **Primary key:** job URL
- **Basic information:** job title, company name, category
- **Location**
- **Operating mode** (remote/hybrid/office)
- **Work schedule** (full-time/part-time/etc)
- **Experience** (junior/mid/senior/etc)
- **Employment type** (B2B/permanent/etc)
- **Salary range** for multiple employment types (if available)
- **Tech stack**: Required technologies with expected proficiency levels

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

## 🚀 Installation

### Prerequisites

- Python 3.9+
- PostgreSQL 15.3+ (or AWS RDS)
- pip and virtualenv

### Setup

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

## 📖 Usage

### Running Scout

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

### AWS Fargate Scheduled Task

Scout is designed to run as a scheduled task on AWS Fargate:

```bash
# Deploy to AWS
cd aws/deployment/scout
./quick-deploy.sh

# Run manually
./management-commands.sh run-now

# View logs
./management-commands.sh logs
```

See `aws/deployment/scout/README.md` for detailed deployment instructions.

## 🗄️ Database Schema

Scout automatically creates and manages the `offers` table:

```sql
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    job_url TEXT UNIQUE NOT NULL,
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

### Data Management

Scout includes automatic data management features:

- **Duplicate Prevention**: Checks for existing URLs before processing
- **Stale Offer Removal**: Removes offers no longer on the website
- **Empty Record Cleanup**: Removes failed extractions (records with only URL)

## 🔍 How Scout Works

### 1. Initialization Phase

```python
# Load environment variables
load_dotenv()

# Setup AWS credentials (if SECRET_ARN provided)
setup_database_credentials_from_secrets(SECRET_ARN)

# Initialize database connection
conn = await init_db_connection()

# Initialize Playwright browser
playwright, browser, page = await init_browser(headless=True)
```

### 2. Link Collection Phase

Scout navigates to JustJoin.it and collects job offer links:

```python
# Navigate to job board
await page.goto("https://justjoin.it/job-offers")

# Collect links by scrolling
offer_urls = await collect_offer_links(page)
```

**Scrolling algorithm:**
- Scrolls down the page progressively
- Collects unique job offer links after each scroll (the page performs dynamic loading)
- Stops when no new links found for `MAX_IDLE_SCROLLS` consecutive scrolls
- Prevents duplicates using set-based tracking

### 3. Data Extraction Phase

For each new offer URL:

```python
# Navigate to offer page
await page.goto(offer_url)

# Extract structured data using selectors
job_data = {
    "job_title": extract(SELECTORS.JOB_TITLE),
    "company": extract(SELECTORS.COMPANY),
    "location": extract(SELECTORS.LOCATION),
    # ... and more
}

# Save to database
await conn.execute("INSERT INTO offers (...) VALUES (...)", job_data)
```

### 4. Cleanup Phase

```python
# Remove stale offers (no longer on website)
await purge_stale_offers(conn, current_urls)

# Remove empty records (failed extractions)
await cleanup_empty_offers(conn)

# Close connections
await conn.close()
await browser.close()
await playwright.stop()
```

## 🎛️ Selectors Configuration

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

### Connection Management

- Automatic connection validation before processing
- Reconnection handling for long-running jobs
- Proper resource cleanup in finally blocks

## 🐛 Debugging & Development

### Enable Visual Browser

```python
# In config.py
HEADLESS = False
```

### Verbose Logging

Scout uses Python's logging module with INFO level by default:

```python
# In cli.py
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
```

**Log messages include:**
- 🔄 Processing status
- ✅ Success indicators
- ⚠️ Warnings
- ❌ Errors
- 📊 Statistics
- 🗑️ Cleanup operations

### Local Testing

```bash
# Run with local environment
python -m scout

# Check logs in console
# Database updates visible in PostgreSQL
```

## 📊 Performance Considerations

### Memory Management

Scout implements automatic browser restarts to prevent memory leaks:

```python
# Restart browser every 500 offers (configurable)
if i > 1 and (i - 1) % ScrapingConfig.RESTART_BROWSER_EVERY == 0:
    await browser.close()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
```

### Rate Limiting

Respectful delays between requests:

```python
# Wait between processing offers
await asyncio.sleep(ScrapingConfig.REQUEST_DELAY)  # 0.5 seconds

# Pause between scrolls
await asyncio.sleep(ScrapingConfig.SCROLL_PAUSE_TIME)  # 0.05 seconds
```

### Database Optimization

- Batch checking of existing URLs
- Single-pass stale offer cleanup
- Efficient UNIQUE constraint handling

## 🔧 Troubleshooting

### Common Issues

**1. Browser fails to start**
```bash
# Install Playwright browsers
playwright install chromium
```

**2. Database connection fails**
```bash
# Check environment variables
echo $AWS_DB_ENDPOINT
echo $AWS_DB_NAME

# Test connection
psql -h $AWS_DB_ENDPOINT -U $AWS_DB_USERNAME -d $AWS_DB_NAME
```

**3. No offers found**
- Check if JustJoin.it is accessible
- Verify selectors haven't changed (website updates)
- Enable `HEADLESS=False` to visually debug

**4. Timeout errors**
```python
# In config.py, increase timeouts:
PAGE_LOAD_TIMEOUT = 120000  # 2 minutes
LINK_TIMEOUT = 5000         # 5 seconds
```

### Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| `⚠️ Database connection lost` | Network issue or timeout | Automatic reconnection attempted |
| `❌ Database 'X' not found` | Database doesn't exist | Create database in AWS RDS console |
| `⚠️ No job offer links found` | Scraping failed or empty page | Check selectors and network |
| `🛑 Stopping - no new links found` | Normal completion | Not an error - scraping finished |

## 🚀 Deployment

### AWS Fargate (Production)

Scout is designed to run as a scheduled ECS task on AWS Fargate:

**Architecture:**
- ECS Cluster with Fargate task
- EventBridge rule for scheduling (daily at 2 AM UTC)
- CloudWatch Logs for monitoring
- Secrets Manager for credentials
- RDS PostgreSQL for data storage

**Deployment:**
```bash
cd aws/deployment/scout
./quick-deploy.sh
```

See `aws/deployment/scout/README.md` for detailed instructions.

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Configure .env
cp .env.example .env
# Edit .env with your credentials

# Run scout
python -m scout
```

## 📈 Monitoring

### Logs

Scout provides detailed logging:

```
2025-10-11 12:00:00 [INFO] ✅ Database connection established successfully
2025-10-11 12:00:01 [INFO] 🔄 Starting to collect job offer links...
2025-10-11 12:00:15 [INFO] 📊 Collected 1250 unique job offer links
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

## 🤝 Contributing

### Adding New Selectors

1. Add selector to `selectors.py`:
```python
NEW_FIELD = SelectorConfig(
    primary='css-selector-here',
    description="Description of what this selects"
)
```

2. Extract in `scrape_core.py`:
```python
new_field = None
try:
    element = page.locator(get_selector(SELECTORS.NEW_FIELD)).first
    if await element.count() > 0:
        new_field = await element.inner_text()
except Exception as e:
    logging.error(f"❌ Error in new_field extraction: {e}")
```

3. Add to database schema and offer_data dict

### Code Style

- Use async/await for I/O operations
- Include comprehensive error handling
- Add logging for important operations
- Follow PEP 8 style guidelines
- Add type hints where possible

## 📝 Future Improvements

- [ ] Support for additional job portals (No Fluff Jobs, theprotocol.it)
- [ ] Parallel processing of offers
- [ ] Machine learning for selector auto-update detection

## 🔗 Related Documentation

- [Aligno Main README](../../README.md)
- [AWS Deployment Guide](../../aws/deployment/scout/README.md)
- [AWS Cleanup Guide](../../aws/cleanup/scout/README.md)
- [Database Schema](../sql/tables/offers.sql)

---

**Proudly built and maitained by Rafal Grajewski for the Aligno project**

