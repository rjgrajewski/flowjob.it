# [cite_start]flowjob.it — how it started [cite: 1]

## [cite_start]Hello World! [cite: 2]
[cite_start]My name is Rafal, and I am the creator of flowjob.it[cite: 3]. [cite_start]I’m a data analyst by profession, a music producer by passion, and someone who moves comfortably between code, sound design, visual storytelling, graphic design, and video editing[cite: 4]. [cite_start]I like building things — whether it’s a beat, a cinematic sequence, or a scalable data pipeline[cite: 5].

[cite_start]At my core, I work with data — designing SQL queries, building reporting models, and creating analytical layers with one clear objective: turning chaos into logic[cite: 6]. [cite_start]On a daily basis, I’m responsible for the technical side of processing recruitment data at scale[cite: 7]. [cite_start]I design data structures, optimize performance, and think in terms of scalability and data quality[cite: 8]. [cite_start]I’m not interested in things merely working — I care about them working in a way that makes sense[cite: 9].

## [cite_start]The problem I wanted to solve [cite: 21]
[cite_start]As I kept expanding my skills in SQL, data transformation, and reporting, I decided to validate myself on the job market[cite: 10]. [cite_start]Very quickly, I ran into two problems[cite: 11]:
1. [cite_start]This kind of skillset often goes hand in hand with expectations around building web scrapers[cite: 12].
2. Browsing job boards felt painfully inefficient. [cite_start]The matching systems were technically filtering by my skills — but not in a way that was meaningful[cite: 13].

The signal was there, but so was the noise. [cite_start]And the noise was winning[cite: 15]. [cite_start]It was frustrating[cite: 16]. [cite_start]So I decided to solve both problems at once: I would build my first scraper, collect the data myself, store it in my own database, and search for jobs on my own terms[cite: 17, 18, 19].

[cite_start]I didn’t want to build “another job board”[cite: 22]. [cite_start]I wanted to build a logical layer between the candidate and the job listing[cite: 23]. [cite_start]Job offers are not just text — they are already data[cite: 24]. [cite_start]If something can be parsed, normalized, and modeled, it can be queried properly[cite: 25]. [cite_start]That’s why the foundation of flowjob is a data model[cite: 27].

## [cite_start]Preparing to build the scraper [cite: 28]
* [cite_start]**Choosing JustJoin.it:** Selected as the primary source due to its focus on transparent tech stacks and structured skill information[cite: 29, 30, 31].
* [cite_start]**Challenges:** The platform uses dynamic DOM loading instead of classic pagination, requiring robust browser automation[cite: 33, 34].
* [cite_start]**Technology:** I chose **Python** to strengthen my market position[cite: 35, 36].
* [cite_start]**Library:** After evaluating Selenium and BeautifulSoup, I landed on **Playwright** for reliability and performance[cite: 40].

## [cite_start]Building the database & infrastructure [cite: 41]
[cite_start]Initially hosted on **Neon.tech** for rapid validation [cite: 44, 45][cite_start], I later migrated to **AWS** to build hands-on cloud engineering experience[cite: 46, 47].

* [cite_start]**Deployment:** Since the daily refresh takes roughly an hour (exceeding Lambda's 15-min limit), I deployed the scraper as a containerized workload on **AWS Fargate (via ECS)**[cite: 49, 50].
* [cite_start]**Storage:** Data is written to **AWS RDS (PostgreSQL)**[cite: 76].
* [cite_start]**Security & Monitoring:** Credentials are managed via AWS Secrets Manager, with observability through CloudWatch Logs[cite: 77].

## [cite_start]Event-driven automation [cite: 52]
[cite_start]The automation follows a model where the data collection (**Scout**) triggers the normalization pipeline (**Atlas**)[cite: 67, 68].

1. [cite_start]**Trigger:** An AWS EventBridge rule schedules the pipeline daily at 02:00 UTC[cite: 71].
2. [cite_start]**Scout (Scraping):** Built in Python using async Playwright to extract metadata[cite: 73, 74, 75].
3. [cite_start]**Atlas (Normalization):** Tackles "skill chaos"[cite: 78, 80].

## [cite_start]Tackling skill chaos with AI [cite: 78]
[cite_start]Many listings contained redundant variants (e.g., *MS Excel*, *Excel*, *Office Excel*)[cite: 81]. [cite_start]I utilized **Amazon Bedrock** to collapse these into single canonical skill names[cite: 83, 84, 85].

[cite_start]Unlike job listings, the normalization layer maintains a persistent dictionary[cite: 90]. [cite_start]This incremental design allows **Atlas** to run as an on-demand serverless function on **AWS Lambda**, keeping it fast and cost-efficient[cite: 91, 92, 93].

## [cite_start]Vibe Coding & The Interface [cite: 95]
[cite_start]My workflow — writing code in tight feedback loops with AI — led me to explore AI-native tools like **Cursor** and **Antigravity**[cite: 95, 96].

[cite_start]I used Cursor to generate a web interface to eliminate the need for manual SQL queries[cite: 97]. [cite_start]While the first results were rough and buggy [cite: 98, 99][cite_start], I stepped into the role of a supervisor, steering the tool and researching React/frontend best practices to improve the user experience[cite: 102, 103].