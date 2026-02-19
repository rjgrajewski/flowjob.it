CREATE TABLE IF NOT EXISTS skills (
    sortkey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_skill_name TEXT UNIQUE NOT NULL,
    canonical_skill_name TEXT,
    category TEXT,
    subcategory TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by skill name
CREATE INDEX IF NOT EXISTS idx_skills_original_skill_name ON skills(original_skill_name);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
