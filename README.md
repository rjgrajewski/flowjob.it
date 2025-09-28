# Aligno: IT Job Search Engine
![Python 3.13](https://img.shields.io/badge/python-3.13-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue)
## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Presentation of market statistics via a dashboard.
3. Interactive job search based on user preferences and skills.
4. Generation of a personalized CV for a specific job posting.

## 🔧 Key Features

1. **JustJoin.it Scraper**
   - Playwright-based scraper collecting job-offer links and details from JustJoin.it.
   - Updates PostgreSQL database by inserting new offers and purging stale ones.


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
├─ src/                                # Source code catalog
│  ├─ sql/                             # SQL initialization scripts
│  │  ├─ 01_offers.sql                 # Table definition
│  │  └─ 02_offers_processed_view.sql  # View definition
│  ├─ validation/                      # Data validation module
│  │  ├─ __init__.py                   # Package initialization
│  │  ├─ models.py                     # Pydantic models for data validation
│  │  ├─ config.py                     # Configuration validation
│  │  └─ validators.py                 # Custom validators and helpers
│  ├─ scraper/                         # Package for scraper functionality
│  │  ├─ __main__.py                   # Package API
│  │  ├─ cli.py                        # CLI module with argument parsing and orchestration
│  │  ├─ db.py                         # Database connection and schema management
│  │  └─ scrape_core.py                # Playwright browser init and scraping logic
├─ .env.example                        # Environment variables example
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

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Run the scraper:**
   ```bash
   cd src
   ../venv/bin/python -m scraper
   ```

6. **Run API (when implemented):**
   ```bash
   cd src
   ../venv/bin/python -m api
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables (copy from `.env.example`):

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aligno_db
# Alternative: individual database settings
DB_USER=aligno
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aligno_db


# Scraper Configuration
HEADLESS=true  # Set to false for debugging (shows browser window)
BATCH_SIZE=500  # Batch size for database operations
SCROLL_PAUSE=0.512  # Pause between scrolls in seconds
MAX_IDLE=5  # Maximum idle scrolls before stopping
SCRAPER_TIMEOUT=30000  # Timeout for page operations in milliseconds
MAX_OFFERS=100  # Limit number of offers for debugging (None = no limit)
```

### 🔒 Data Validation & Security

The application now includes comprehensive data validation using Pydantic models:

- **Input Validation**: All scraped data is validated before database insertion
- **Environment Validation**: Configuration is validated on startup
- **SQL Injection Protection**: Database names and queries are sanitized
- **Data Sanitization**: All string inputs are cleaned and validated
- **Error Handling**: Robust error handling with proper logging

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
- Either `DATABASE_URL` OR `DB_PASSWORD` (if using individual DB settings)

## 📑 Code Highlights

- **validation/** - data validation and configuration management:
   - `models.py`: Pydantic models for validating job offers and configuration
   - `config.py`: Environment variable validation and configuration loading
   - `validators.py`: Custom validators and data sanitization utilities

- **scraper/** - package that provides:
   - `__main__.py`: package API for the scraper.
   - `cli.py`: CLI wrapper with environment validation and error handling.
   - `db.py`: handles asyncpg connection, database creation, inserts and purges with validation.
   - `scrape_core.py`: contains browser initialization, scrolling, link collection, and validated offer parsing.


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