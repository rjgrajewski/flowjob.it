# Aligno: IT Job Search Engine
![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange)

## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Interactive job search based on user preferences and skills.
3. Generation of a personalized CV for a specific job posting.
4. Presentation of market statistics via a dashboard.

## 🔧 Key Features

1. ✅ **Data management** is built using PostgreSQL as the primary database, providing reliable and scalable storage for all job offers and analytics data. For secure and managed cloud infrastructure, the database is hosted on AWS RDS (Relational Database Service).

1. ✅ **Scout**
   Playwright-based scraper collecting job-offer links and details from JustJoin.it.

2. 🛠️ **Atlas** (In progress)
   - A backend service that uses AI to automatically analyze and categorize the skills, technologies, and other details in job offers stored in the database, reducing duplication and standardizing tech stack entries to make it easier for users to filter offers based on specific technologies.

3. ⏳ **Job search** (Planned)
   - Allows users to search for job offers based on their skills and preferences.
   - Provides a personalized job search experience.
   - Displays job offers sorted by match to the user's skills and preferences.

4. ⏳ **CV generation** (Planned)
   - Generates a personalized CV for a specific job posting.
   - Allows users to customize their CV based on the job offer.
   - Provides an option to download the CV in various formats (PDF, DOCX, etc.).

5. ⏳ **Market overview** (Planned)
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

---

**Proudly built and maintained by Rafal Grajewski for the Aligno project**