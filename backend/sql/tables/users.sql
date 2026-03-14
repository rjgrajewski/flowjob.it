CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table to store profile and authentication info
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    contact_info TEXT,
    -- Contact details for CV (phone, address, etc.)
    -- Authentication provider details
    provider TEXT NOT NULL,
    -- 'google', 'github', 'apple', 'linkedin'
    provider_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_id)
);
-- User skills table to link users to skills with a specific type
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills (uuid) ON DELETE CASCADE,
    skill_type TEXT NOT NULL,
    -- 'HAS', 'AVOIDS', 'SKIPPED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id, skill_type)
);
-- Index for faster lookups of user skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills (user_id);
