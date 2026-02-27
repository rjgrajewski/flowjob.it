# flowjob.it — how it started

![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=for-the-badge&logo=python&logoColor=white) ![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black) ![AWS](https://img.shields.io/badge/AWS-Fargate%20%7C%20RDS%20%7C%20Bedrock-ff9900?style=for-the-badge&logo=amazon-aws&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-Browser%20Automation-2ead33?style=for-the-badge&logo=playwright&logoColor=white)

## Hello World! 🚀

> My name is **Rafal**, and I am the creator of [flowjob.it](https://flowjob.it). I’m a **Data Analyst** by profession, a **Music Producer** by passion, and someone who moves comfortably between code, sound design, visual storytelling, graphic design, and video editing. I like building things — whether it’s a beat, a cinematic sequence, or a scalable data pipeline.

At my core, I work with data — designing SQL queries, building reporting models, and creating analytical layers with one clear objective: **turning chaos into logic**. 

On a daily basis, I’m responsible for the technical side of processing recruitment data at scale. I design data structures, optimize performance, and think in terms of scalability and data quality. I’m not interested in things merely working — I care about them working in a way that makes sense.

---

## The Problem I Wanted to Solve 🔍

As I kept expanding my skills in SQL, data transformation, and reporting, I decided to validate myself on the job market. Very quickly, I ran into two main hurdles:

1. **The Web-Scraper Expectation**: This kind of skillset often goes hand in hand with expectations around building robust web scrapers.
2. **The Noise Problem**: Browsing job boards felt painfully inefficient. Matching systems were technically filtering by skills—but not in a way that was meaningful.

> [!IMPORTANT]
> The signal was there, but so was the noise. **And the noise was winning.**

It was frustrating. So I decided to solve both problems at once: I would build my first scraper, collect the data myself, store it in my own database, and search for jobs on my own terms. 

I didn't want to build "another job board." I wanted to build a **logical layer** between the candidate and the job listing. Job offers are not just text — they are already data. If something can be parsed, normalized, and modeled, it can be queried properly. 

**That’s why the foundation of flowjob is a data model.**

---

## Technical Journey 🛠️

### Preparing the Scraper
* **Source:** [JustJoin.it](https://justjoin.it) — Selected for its focus on transparent tech stacks.
* **Challenges:** Dynamic DOM loading required robust browser automation instead of standard pagination.
* **Stack:** **Python** + **Playwright** (chosen for reliability and performance over Selenium).

### Infrastructure & Cloud
Initially hosted on Neon.tech for rapid validation, I later migrated to **AWS** to build hands-on cloud engineering experience.

* **Deployment:** Containerized workload on **AWS Fargate (ECS)** to handle ~1h scrape duration (surpassing Lambda limits).
* **Storage:** Persistent data in **AWS RDS (PostgreSQL)**.
* **Ops:** Credentials managed via **AWS Secrets Manager**, with observability through **CloudWatch**.

---

## Event-Driven Automation ⚡

The automation follows a modular model where data collection triggers the normalization pipeline:

1. **Trigger**: AWS EventBridge rule schedules the pipeline daily at **02:00 UTC**.
2. **Scout (Scraping)**: Async Python service extracting metadata using Playwright.
3. **Atlas (Normalization)**: The engine that tackles "skill chaos."

### Tackling Skill Chaos with AI 🧠

Many listings contained redundant variants (e.g., *MS Excel*, *Excel*, *Office Excel*). I utilized **Amazon Bedrock** to collapse these into single canonical skill names.

> [!TIP]
> Unlike the scraping layer, the normalization layer maintains a **persistent dictionary**. This incremental design allows **Atlas** to run as a fast, cost-efficient **AWS Lambda** function.

---

## Vibe Coding & The Interface 🎨

My workflow — writing code in tight feedback loops with AI — led me to explore AI-native tools like **Cursor** and **Antigravity**.

* **The Vision**: I used Cursor to generate a web interface to eliminate the need for manual SQL queries.
* **The Evolution**: While the first results were rough, I stepped into the role of a **supervisor**, steering the tool and researching React/frontend best practices to craft a premium user experience.

---
*Built with passion by Rafal Grajewski*