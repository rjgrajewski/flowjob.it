CREATE TABLE IF NOT EXISTS offer_skills (
    job_url TEXT REFERENCES offers(job_url) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(sortkey) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_url, skill_id)
);

-- Index for faster lookups by skill_id
CREATE INDEX IF NOT EXISTS idx_offer_skills_skill_id ON offer_skills(skill_id);

-- Index for faster lookups by job_url
CREATE INDEX IF NOT EXISTS idx_offer_skills_job_url ON offer_skills(job_url);
