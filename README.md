# Aligno: IT Job Search Engine
![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange) ![AWS](https://img.shields.io/badge/AWS-Fargate-orange)

## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Interactive job search based on user preferences and skills.
3. Generation of a personalized CV for a specific job posting.
4. Presentation of market statistics via a dashboard.

## 🔧 Key Features

1. ✅ **Data Management**
   - Uses PostgreSQL as the primary database for reliable and scalable storage of all job offers and analytics data.
   - The database is securely managed in the cloud using AWS RDS (Relational Database Service).

2. ✅ **Scout**
   - [**Scout**](./src/scout/README.md): Playwright-based scraper that automatically collects job-offer links and detailed information from JustJoin.it.
   - Supports automated task scheduling and execution in AWS Fargate, enabling continuous collection of new offers, and removal of expired or stale offers without manual intervention.
   - Handles three phases: efficient link collection, detailed data extraction, and cleanup.

3. 🛠️ **Atlas** *(In Progress)*
   - Backend service powered by AI to automatically analyze and categorize skills, technologies, and other details within job offers.
   - Standardizes and deduplicates tech stack entries for better filtering and consistency.

4. ⏳ **Job Search** *(Planned)*
   - Lets users search for job offers based on their skills and preferences.
   - Provides a personalized job search experience.
   - Sorts job offers by match to a user's profile and requirements.

5. ⏳ **CV Generation** *(Planned)*
   - Generates a personalized CV tailored to a chosen job posting.
   - Enables users to customize their CV using data from the job offer.
   - Supports downloading the CV in multiple formats (PDF, DOCX, etc.).

6. ⏳ **Market Overview** *(Planned)*
   - Presents market statistics via an interactive dashboard.
   - Offers insights including:
     - Number of job offers by month, technology, or location.
     - Most popular technologies and skills.
     - Relationships between salary and technology.

## 📁 Architecture

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