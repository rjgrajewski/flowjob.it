# Aligno: IT Job Search Engine
![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange) ![OpenAI](https://img.shields.io/badge/OpenAI-1.3.0-purple) ![Pydantic](https://img.shields.io/badge/Pydantic-2.11.9-green)

## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Presentation of market statistics via a dashboard.
3. Interactive job search based on user preferences and skills.
4. Generation of a personalized CV for a specific job posting.

## 📊 Current Status

- ✅ **JustJoin.it Scraper**: Fully implemented with Playwright
- ✅ **Database Schema**: Complete with offers table and processed view
- ✅ **AWS RDS Support**: Ready for production deployment
- ✅ **Dependency Management**: All dependencies pinned to specific versions for reproducible builds
- ✅ **Environment Configuration**: Simplified AWS RDS-focused configuration
- ⏳ **Market Dashboard**: Planned
- ⏳ **Job Search API**: Planned
- ⏳ **CV Generation**: Planned

## 📦 Dependencies

The project uses the following key dependencies with pinned versions for reproducible builds:

- **Database**: `asyncpg==0.29.0` for async PostgreSQL connections
- **Web Scraping**: `playwright==1.52.0` for browser automation
- **Web Framework**: `fastapi==0.104.1` with `uvicorn==0.24.0` for API development
- **AI Integration**: `openai==1.3.0` for future AI-powered features
- **Data Validation**: `pydantic==2.11.9` for data modeling and validation
- **Environment**: `python-dotenv==1.0.0` for environment variable management
- **Type Checking**: `mypy==1.7.0` for static type checking
- **HTTP Client**: `httpx==0.28.1` for async HTTP requests

## 🔧 Key Features

1. **JustJoin.it Scraper**
   - Playwright-based scraper collecting job-offer links and details from JustJoin.it.
   - Updates PostgreSQL database by inserting new offers and purging stale ones.
   - **AWS RDS Ready**: Automatically detects and connects to AWS RDS databases.

2. **Market overview** (To do)
   - Presents market statistics via a dashboard.
   - Displays insights such as:
     - Number of job offers per month, technology, location etc.
     - Most popular technologies and skills.
     - Dependencies between salary and technology.

3. **Job search** (To do)
   - Allows users to search for job offers based on their skills and preferences.
   - Provides a personalized job search experience.
   - Displays job offers sorted by match to the user's skills and preferences.

4. **CV generation** (To do)
   - Generates a personalized CV for a specific job posting.
   - Allows users to customize their CV based on the job offer.
   - Provides an option to download the CV in various formats (PDF, DOCX, etc.).

## 📁 Repository Structure

```
Aligno/
├─ src/                                # Source code directory
│  ├─ sql/                             # SQL scripts directory
│  │  ├─ tables/                       # Table definitions
│  │  │  └─ offers.sql                 # Job offers table with auto-parsing
│  │  └─ views/                        # View definitions
│  │     └─ offers_parsed.sql          # Parsed offers view
│  └─ scraper/                         # Package for scraper functionality
│     ├─ __main__.py                   # Package API
│     ├─ cli.py                        # CLI module with argument parsing and orchestration
│     ├─ db.py                         # Database connection and schema management
│     └─ scrape_core.py                # Playwright browser init and scraping logic
├─ venv/                               # Virtual environment (included)
├─ .env.example                        # Environment variables template
├─ .gitignore                          # Git ignore rules
├─ .cursorignore                       # Cursor ignore rules
├─ requirements.txt                    # Python dependencies
├─ mypy.ini                            # Mypy configuration
└─ README.md                           # Project documentation
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Aligno
   ```

2. **Set up virtual environment:**
   ```bash
   # Virtual environment is already included in the project
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note:** All dependencies are pinned to specific versions for reproducible builds.

4. **Install Playwright browsers (required for scraping):**
   ```bash
   playwright install
   ```

5. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS RDS database credentials
   ```

6. **Run the scraper:**
   ```bash
   cd src
   ../venv/bin/python -m scraper
   ```

7. **Run API (when implemented):**
   ```bash
   cd src
   ../venv/bin/python -m api
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory by copying from `.env.example` and updating with your actual values:

### 🏗️ **Database Configuration**

The project is configured to use AWS RDS PostgreSQL for production deployment. Configure your database connection by setting the following variables in your `.env` file:

```bash
# AWS RDS Configuration (Required)
AWS_DB_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_DB_NAME=aligno-db
AWS_DB_USERNAME=your_db_username
AWS_DB_PASSWORD=your_db_password
```

**Note:** The project is optimized for AWS RDS deployment. For local development, you can also use a local PostgreSQL instance by setting the `DATABASE_URL` environment variable, but AWS RDS is the recommended approach.

### 🎛️ **Scraper Configuration:**
```bash
HEADLESS=true  # Set to false for debugging (shows browser window)
BATCH_SIZE=500  # Batch size for database operations
SCROLL_PAUSE=0.512  # Pause between scrolls in seconds
MAX_IDLE=5  # Maximum idle scrolls before stopping
SCRAPER_TIMEOUT=30000  # Timeout for page operations in milliseconds
MAX_OFFERS=100  # Limit number of offers for debugging (None = no limit)
```

### 🤖 **OpenAI Configuration (for future AI features):**
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=512
OPENAI_TEMPERATURE=0.0
```

### 🔒 Security Features

The application includes basic security measures:

- **SQL Injection Protection**: Database names are validated
- **Data Sanitization**: String inputs are cleaned before processing
- **Error Handling**: Robust error handling with proper logging
- **AWS RDS Integration**: Secure connection to cloud databases

### 🐛 Debugging & Development

For development and debugging purposes, you can limit the number of offers scraped:

```bash
# Limit to 50 offers for quick testing
MAX_OFFERS=50

# Or disable limit for full scraping
MAX_OFFERS=
```

**Debug Tips:**
- Set `HEADLESS=false` to see the browser window during scraping
- Use `MAX_OFFERS=10` for very quick testing
- Monitor logs for validation errors and data quality issues

### 🚨 Required Environment Variables

The following environment variables are **required**:
- `AWS_DB_ENDPOINT`: Your AWS RDS PostgreSQL endpoint
- `AWS_DB_NAME`: Database name
- `AWS_DB_USERNAME`: Database username
- `AWS_DB_PASSWORD`: Database password

### 📋 Optional Environment Variables

- `OPENAI_API_KEY`: Required for future AI-powered features (CV generation, skill matching)
- `HEADLESS`: Set to `false` for debugging (shows browser window during scraping)
- `MAX_OFFERS`: Limit number of offers for testing (leave empty for unlimited)
- `DATABASE_URL`: Alternative to AWS RDS settings (for local development)

## 🌐 AWS RDS Setup

### **Prerequisites:**
1. AWS RDS PostgreSQL instance running
2. Security Group allowing inbound connections on port 5432
3. Database created with appropriate user permissions

### **Database Setup:**
1. Connect to your RDS instance and run the SQL scripts from `src/sql/`:
   ```sql
   -- Run tables/offers.sql to create the offers table with triggers
   -- Run views/offers_parsed.sql to create the parsed view
   ```

2. Ensure your database user has the following permissions:
   - `CREATE TABLE`
   - `INSERT`, `UPDATE`, `DELETE` on the `offers` table
   - `SELECT` on all tables

### **Connection Testing:**
```bash
cd src
../venv/bin/python -c "
import asyncio
from scraper.db import init_db_connection

async def test():
    try:
        conn = await init_db_connection()
        print('✅ AWS RDS connection successful!')
        await conn.close()
    except Exception as e:
        print(f'❌ Connection failed: {e}')

asyncio.run(test())
"
```

## 📑 Code Highlights

- **src/scraper/** - scraper package:
   - `__main__.py`: Package API for the scraper
   - `cli.py`: CLI wrapper with environment checking and error handling
   - `db.py`: Handles asyncpg connection, database creation, inserts and purges with AWS RDS support
   - `scrape_core.py`: Contains browser initialization, scrolling, link collection, and offer parsing

- **src/sql/** - database schema:
   - `tables/offers.sql`: Job offers table definition with automatic salary_b2b parsing
   - `views/offers_parsed.sql`: Parsed offers view for analysis

## 💰 Salary Parsing Features

The `offers` table automatically parses B2B salary information using database triggers:

### **Architecture:**
- **offers table**: Contains raw `salary_b2b` text + automatically parsed columns
- **Database trigger**: Automatically populates parsed columns on INSERT/UPDATE
- **offers_parsed view**: Additional transformations for analysis

### **Parsed Columns (in offers table):**
- `salary_b2b` (TEXT): Original raw text from scraper
- `salary_b2b_min` (NUMERIC): Minimum salary value (auto-populated)
- `salary_b2b_max` (NUMERIC): Maximum salary value (auto-populated)
- `salary_b2b_per` (TEXT): Time period - 'hour', 'day', 'month', or 'year' (auto-populated)

### **How It Works:**
- **Trigger-Based Parsing**: PostgreSQL trigger `parse_salary_b2b_trigger` fires on INSERT/UPDATE
- **Automatic**: No manual intervention needed - scraper just inserts raw data
- **Format Support**: Handles salary ranges like "150 - 175 PLN\nNet per hour - B2B"
- **Single Values**: If no range exists, min and max are the same
- **100% Success Rate**: Successfully parses all standard JustJoin.it salary formats

### **Example:**
```sql
-- Insert raw data (scraper does this):
INSERT INTO offers (salary_b2b, ...) 
VALUES ('18 000 - 30 000 PLN
Net per month - B2B', ...);

-- Trigger automatically populates:
-- salary_b2b_min: 18000
-- salary_b2b_max: 30000
-- salary_b2b_per: 'month'
```

### **Usage:**
```sql
-- Query parsed data directly from offers table
SELECT job_title, salary_b2b_min, salary_b2b_max, salary_b2b_per
FROM offers
WHERE salary_b2b_per = 'month' AND salary_b2b_min > 15000;
```

## 📝 Future Improvements

**Market overview:**
   * To choose frontend stack (React, Vue, Angular)
   * To choose chart library (Chart.js, Recharts, D3)
   * Components:
     * MVP
       * Total number of job offers
       * Top technologies
       * Salary statistics
       * Global filtering (by locations, operating modes, experience, categories etc.)
     * Future
       * Alerts
       * Trends
     * Nice to have
       * Top companies
       * Heatmaps

**Job search:**
   * API (Flask/Django, FastAPI, Node/Express)
   * To choose frontend stack (React, Vue, Angular)

**CV generation:**
   * Template (HTML/CSS, Markdown or other)
   * Optional: template engine (Jinja2, Handlebars, etc.)
   * Optional: AI generated sections (About me etc.)

**Scraper:**
   * To consider: Scheduling (cron/GitHub Actions)
   * To consider: Support for other job portals
   * To consider: Store configuration constants (URLs, timeouts, selectors) in `constants.py` or `config.toml`

**Database:**
   * Consider implementing skills normalization system
   * Consider implementing skill matching algorithms for job recommendations
   * Database migration scripts for production deployments
   * Multi-region AWS RDS setup for high availability