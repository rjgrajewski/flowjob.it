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
    salary_perm TEXT,
    salary_specific_task TEXT,
    work_type TEXT,
    experience TEXT,
    employment_type TEXT,
    operating_mode TEXT,
    tech_stack TEXT
);