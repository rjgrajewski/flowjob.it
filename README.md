# Aligno: IT Job Search Engine
![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange)

## 📚 Table of Contents

[Overview](#-overview)
[Current Status](#-current-status)

## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Presentation of market statistics via a dashboard.
3. Interactive job search based on user preferences and skills.
4. Generation of a personalized CV for a specific job posting.

## 📊 Current Status

- ✅ **Database**: Uses AWS RDS for secure, cloud-hosted PostgreSQL storage.
- ✅ **Scout**: Automated Playwright based web scraper deployed as an AWS Fargate task, running once daily to keep job data up-to-date.
- 🛠️ **Atlas**: In progress – building out an engine to organize, classify, and enable deeper querying of the collected job offer data.
- ⏳ **Job Search API**: Planned
- ⏳ **CV Generation**: Planned
- ⏳ **Market Dashboard**: Planned

## 🔧 Key Features

1. **Scout**
   - Playwright-based scraper collecting job-offer links and details from JustJoin.it.

2. **Atlas**
   - A backend service that uses AI to automatically analyze and categorize the skills, technologies, and other details in job offers stored in the database, reducing duplication and standardizing tech stack entries to make it easier for users to filter offers based on specific technologies.

3. **Job search** (To do)
   - Allows users to search for job offers based on their skills and preferences.
   - Provides a personalized job search experience.
   - Displays job offers sorted by match to the user's skills and preferences.

4. **CV generation** (To do)
   - Generates a personalized CV for a specific job posting.
   - Allows users to customize their CV based on the job offer.
   - Provides an option to download the CV in various formats (PDF, DOCX, etc.).

5. **Market overview** (To do)
   - Presents market statistics via a dashboard.
   - Displays insights such as:
     - Number of job offers per month, technology, location etc.
     - Most popular technologies and skills.
     - Dependencies between salary and technology.

## 📁 Repository Structure

```
Aligno/
├─ src/                                # Source code directory
│  ├─ atlas/                           # Atlas module (AI based processing)
│  │  ├─ placeholder
│  │  └─ placeholder
│  ├─ scout/                           # Web scraping module for automatic job offer collection from JustJoin.it
│  │  ├─ __main__.py                   # Main entry point for launching the Scout
│  │  ├─ aws_secrets.py                # Integration with AWS Secrets Manager for credentials management
│  │  ├─ cli.py                        # Command-line interface for running the scraper and utility tasks
│  │  ├─ config.py                     # Configuration parameters for the scraper (limits, timeouts, etc.)
│  │  ├─ db.py                         # Database operations (connections, inserts, cleanup)
│  │  ├─ scrape_core.py                # Core scraper logic: link collection, data extraction, cleanup
│  │  ├─ selectors.py                  # Centralized selectors configuration for scraping
│  │  └─ README.md                     # Documentation for the Scout module
│  └─ sql/                             # Scout module (web scraper)
│     ├─ tables/                       # Table definitions
│     │  └─ offers.sql                 # Job offers table
│     └─ views/                        # View definitions
│        └─ offers_parsed.sql          # Parsed offers view
├─ venv/                               # Virtual environment (included)
├─ .cursorignore                       # Cursor ignore rules
├─ .dockerignore                       # Docker ignore rules
├─ .env.example                        # Environment variables template
├─ .gitignore                          # Git ignore rules
├─ requirements.txt                    # Python dependencies
├─ mypy.ini                            # Mypy configuration
└─ README.md                           # Project documentation
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



## 📑 Code Highlights

- **src/scout/** - Web scraper package for automated job offer collection
- **src/atlas/** - AI-powered skills extraction and categorization module
- **src/sql/** - Database schema and views for job offers and skills


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

**Scout (Scraper Module):**
   * To consider: Support for other job portals

**Database:**
   * Consider implementing skills normalization system
   * Consider implementing skill matching algorithms for job recommendations
   * Database migration scripts for production deployments
   * Multi-region AWS RDS setup for high availability

## 🚀 AWS Deployment

The project uses **AWS Fargate Scheduled Task** - runs daily at 2 AM UTC and automatically stops after completion.

See `aws/deployment/scout/README.md` for detailed deployment instructions.
See `aws/cleanup/scout/README.md` for cleanup instructions.

---

**Proudly built and maintained by Rafal Grajewski for the Aligno project**