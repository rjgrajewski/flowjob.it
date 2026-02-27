flowjob.it — how it started
Hello World!
My name is Rafal, and I am the creator of flowjob.it.
I’m a data analyst by profession, a music producer by passion, and someone who moves comfortably between code, sound design, visual storytelling, graphic design, and video editing. I like building things — whether it’s a beat, a cinematic sequence, or a scalable data pipeline.
At my core, I work with data — designing SQL queries, building reporting models, and creating analytical layers with one clear objective: turning chaos into logic.
On a daily basis, I’m responsible for the technical side of processing recruitment data at scale. I design data structures, optimize performance, and think in terms of scalability and data quality. I’m not interested in things merely working — I care about them working in a way that makes sense.
As I kept expanding my skills in SQL, data transformation, and reporting, I decided to validate myself on the job market.
Very quickly, I ran into two problems.
First, I noticed that this kind of skillset often goes hand in hand with expectations around building web scrapers. Second, browsing job boards felt painfully inefficient. The matching systems were technically filtering by my skills — but not in a way that was meaningful.
I would receive offers that indeed mentioned SQL or data modeling, yet at the same time required things that immediately disqualified me — for example, fluency in additional foreign languages beyond English. The signal was there, but so was the noise. And the noise was winning.
It was frustrating.
So I decided to solve both problems at once.
I would build my first scraper. I would collect the data myself. I would store it in my own database. And I would search for jobs on my own terms.
That was the real beginning of flowjob.it.
The problem I wanted to solve
I didn’t want to build “another job board.” The internet doesn’t need one. I wanted to build a logical layer between the candidate and the job listing.
Job offers are not just text — they are already data. They just aren’t treated that way.
If something can be parsed, normalized, and modeled, it can be queried properly. And once you can query it properly, filtering, comparison, and matching start to actually make sense.
That’s why the foundation of flowjob is not a list of job ads. The foundation is a data model.
Preparing to build the scraper
1. Choosing JustJoin.it as the data source
I selected JustJoin.it as my primary data source because of its strong focus on transparent tech stacks and the overall quality of engineering offers. The platform exposes structured skill information more consistently than most job boards, which made it an ideal candidate for data-driven processing.
2. The challenges of scraping JJ.it
Scraping JustJoin.it turned out to be non-trivial. The platform doesn’t rely on classic pagination, and job listings are loaded dynamically into the DOM. This required a more robust browser automation strategy and careful handling of asynchronous content.
3. Choosing Python
For the implementation, I chose Python — both for its versatility and because deepening my Python skills could directly strengthen my position on the job market.
I had previously completed a fundamentals course, but learning on abstract examples is very different from building a product that immediately improves your own workflow.
4. Library experiments and the final choice
Based on countless deep dives with ChatGPT, I evaluated the libraries I would rely on. My early experiments started with Selenium and BeautifulSoup, but I ultimately landed on Playwright, which delivered the most reliable and performant results.
Building the database
In my day-to-day work, I have plenty of opportunities to transform and model data that already exists in databases. What I hadn’t done before was designing and administering a database from scratch — so this part required a fair amount of self-learning and hands-on experimentation.
For initial testing purposes, the database was hosted on Neon.tech. It allowed me to move quickly and validate early assumptions without heavy infrastructure overhead.
Later, for reasons similar to my choice of Python, I decided to migrate the database into the AWS cloud. Building hands-on experience with AWS was itself a strategic decision — one that not only supported the scalability of flowjob, but also strengthened my broader engineering skill set.
While exploring the AWS ecosystem, I also decided to move the scraper itself into the cloud. AWS Lambda was not a viable option — the daily refresh process removes outdated listings and ingests hundreds of new ones, which takes roughly an hour to complete, far beyond Lambda’s 15 minute execution limit.
Instead, I deployed the scraper as a containerized workload on AWS Fargate (via ECS). This serverless container approach gives me full control over runtime and isolation while keeping the operational overhead minimal and the workload easily scalable when needed.
Event-driven automation
EventBridge (02:00 UTC)
        │
        ▼
ECS Fargate Task
   (Scout Scraper)
        │
        ▼
AWS RDS (PostgreSQL)
        │
        ▼
Atlas Normalization Pipeline
        │
        ▼
flowjob Search Layer
The automation follows an event-driven model, where the data collection process (Scout) triggers the normalization pipeline (Atlas).
Scout is the codename for the scraping module, while Atlas is the codename for the skill normalization module. I deliberately named them this way because I treated them as two independent sub products within the broader flowjob ecosystem — each with its own responsibility, lifecycle, and potential to evolve separately.
1. Trigger & Scheduling
An AWS EventBridge rule schedules the pipeline to run daily at 02:00 UTC. The rule starts an ECS task running on AWS Fargate, which ensures the scraper only consumes resources when it actually runs.
2. The scraping process (Scout)
The Scout service (scraping module) is built in Python using asynchronous Playwright. It navigates through JustJoin.it listings, collects job links, and extracts detailed metadata such as title, description, and technology stack. The scraper is designed with a "polite" architecture, ensuring that it doesn't overload JustJoin.it servers by managing request frequency and concurrency.

Scraped data is written directly into PostgreSQL hosted on AWS RDS.
Database credentials are securely retrieved from AWS Secrets Manager, and the entire scraping run is fully observable through AWS CloudWatch Logs.
Tackling skill chaos with AI
With a working database and a daily refresh pipeline in place, I could finally start querying jobs for myself using SQL.
That’s when I hit the next barrier: skill chaos.
Many listings contained the same requirements written in multiple ways — for example: MS Excel, Microsoft Excel, Excel, Office Excel. From a human perspective they mean the same thing, but from a data perspective they fragment the signal and create unnecessary duplication.
I started exploring whether an LLM could be used to collapse these variants into a single canonical skill name and reduce repetition across the dataset.
This is where I brought another AWS capability into the architecture: Amazon Bedrock. The Atlas normalization service (skill normalization module) leverages Bedrock to interpret raw skill text and map it into a consistent semantic representation.
Initially, my plan was to base normalization on embedding vectors (and yes — that was the right instinct). I experimented with semantic similarity approaches, but in practice I achieved better precision with a different strategy.
The current approach sorts raw skills alphabetically, splits them into manageable batches, and normalizes them using a carefully tuned system prompt. After several prompt iterations and evaluation cycles, this method started producing consistently high-quality canonical mappings.
Unlike job listings — which are removed once they become outdated — the skill normalization layer maintains a persistent dictionary. This allows the system to reuse previously normalized skills and significantly reduce token usage if the same variant appears again in the future.
Each normalization run processes only new, unseen skill entries, which keeps the pipeline extremely fast and cost-efficient. Because of this lightweight incremental design, Atlas was a perfect candidate for AWS Lambda and now runs as an on-demand serverless function.
The result is a cleaner, deduplicated skill layer that makes downstream filtering and matching significantly more reliable.
Around this stage, I also discovered that the way I was working — writing code in tight feedback loops with AI — closely resembles what the community calls vibe coding. That realization led me to explore more specialized AI‑native development tools, starting with Cursor and later Antigravity, which further accelerated my iteration speed and experimentation workflow.

While exploring Cursor’s capabilities, I asked it to generate a web application that would wrap everything I had built so far in a clean graphical interface — eliminating the need to write SQL queries every time I wanted to search for relevant roles.

The first results of the generated interface were far from ideal. The UI looked rough and amateurish, contained bugs, and occasionally crashed, but… I've made a thing!

Just a few weeks earlier, I had no practical experience coding in Python. Suddenly, I was looking at the early graphical shell of my own application.

I stepped into the role of a supervisor and began deliberately steering Cursor toward the direction I wanted. In parallel, I researched frontend best practices and explored what was possible with React to progressively improve the user experience.



Designing the matching experience

The most important part of the application is the philosophy of matching job offers to a candidate’s skill profile — and I needed a solution that would feel genuinely user‑friendly.

Even after removing much of the noise through normalization, the skill dictionary still contained several thousand entries. My first experiments used dropdowns and text autocomplete, but the sheer volume of suggestions remained overwhelming and discouraging.

So I reframed the problem: what if selecting skills felt intuitive, playful, and almost game‑like instead of another rigid filter?

### Frontend — the “vibe interface”

I wanted the experience to feel fundamentally different from traditional job search filters. Instead of forms and dropdowns, the interface needed to feel alive, responsive, and a bit playful.

Using Vite and React as the foundation, I built an interactive skill map where technologies behave more like objects in a living ecosystem than static UI elements. With the help of D3‑force and Framer Motion, the interface reacts fluidly to every user action — bubbles move, reposition, and flow into the user profile in a way that feels intentional and satisfying.

The goal wasn’t visual flash for its own sake. It was about reducing cognitive friction. Users don’t have to think in terms of filters or queries — they explore. They tap. They follow momentum. The system continuously responds by surfacing the next most relevant skills, keeping the experience smooth and engaging.

Under the hood, the experience is carefully tuned for performance so the map remains perfectly fluid even with many elements on screen. But from the user’s perspective, it should simply feel fast, natural, and oddly satisfying.

Backend — SQL‑native recommendation engine

Behind this playful surface sits a very pragmatic core. Instead of relying on token‑heavy ML services, the heart of the recommendation logic lives directly in PostgreSQL (SkillsRepository).

The system starts simple. When a user has not selected any skills yet, the database performs a straightforward aggregation across the market and surfaces the most in‑demand technologies. This gives an immediate, data‑driven snapshot of what’s hot.

As soon as the user selects their first skill, the logic shifts into personalization mode. The database looks at real co‑occurrence patterns inside job offers — finding which skills most frequently appear together and which ones statistically complete the user’s profile.

In practice, this creates a recommendation loop that feels predictive without requiring heavy ML infrastructure. The map begins to surface bubbles the user is genuinely likely to click, because the system is grounded in actual market data rather than generic similarity heuristics.

With the skill‑building experience in place, I could finally move to the core purpose of the product: matching users with actual job offers.

One of the most important design decisions was where the Match Score should be calculated. I chose to compute it in real time on the frontend, which makes the experience feel immediate and responsive.

While flowjob.it provides a powerful filtering and matching layer, I wanted to remain fair to the original data source. To avoid "stealing" traffic from JustJoin.it, I made a conscious decision not to display full application forms or complete descriptions. If a user wants to see the full details of an offer or actually apply, they are redirected to the original listing on JustJoin.it.

Skills listed on each job card are fully interactive. While browsing, users can toggle them exactly like on the skill map — left click means "I have it," right click means "avoid." The Match Score updates instantly, and user preferences are persisted.

The result is that browsing jobs becomes a form of passive profile training. Every interaction teaches the system more about the user’s trajectory, continuously refining the quality of recommendations without requiring explicit form‑filling.

With the matching loop in place, the MVP was essentially complete. The final feature I added was the CV builder — born from a simple observation: right before applying, it often makes sense to slightly tailor your document to highlight what matters most for a specific role.

The CV builder is the last mile of the flowjob funnel — the moment when data about your skills and experience materializes into a professional document ready to send to a recruiter.

Unlike traditional tools that generate files on the server, flowjob renders the CV directly in the browser using @react-pdf/renderer. This enables true live preview — every change in the form (name, dates, new skills) appears instantly on a virtual A4 page, making the editing process fast and tangible.

This is also where the earlier modules connect in a meaningful way. Skills selected on the map don’t disappear into a black box — they flow directly into the CV builder, where users can highlight the ones they want to emphasize for a given application. This keeps the profile and the document naturally in sync.

From a UX perspective, the builder is designed to stay out of the user’s way. A debounced auto‑save mechanism persists edits in the background, reducing the risk of lost work. Typography and spacing were tuned for readability and ATS friendliness, while the internal logic keeps roles properly ordered and dates normalized.

In the end, the CV builder is not just a text editor. It’s the final step that turns your activity inside flowjob into a market‑ready asset.

What’s next

The current MVP proves the core loop works — but there are two major directions I’m already exploring.

First, one‑click CV tailoring. The goal is to let users adapt their CV to a specific job offer automatically, highlighting the most relevant skills and experience with minimal manual effort.

Second, deeper recommendation intelligence. Today, matching is primarily driven by the tech stack layer. The next step is to analyze the full semantic content of both the CV and the job description, allowing flowjob to generate recommendations based on true contextual fit rather than keywords alone.

Both directions push flowjob closer to what I ultimately want it to be: not just a job search tool, but an intelligent career interface.