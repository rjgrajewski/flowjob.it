-- Migration 002: Support multiple canonical names per original_skill_name
-- (AI-based multi-skill expansion)
-- Run once against the existing database.
-- 1. Drop the old single-column unique constraint on original_skill_name
--    (may be named differently depending on table history)
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_original_skill_name_key;
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_new_original_skill_name_key;
-- 2. Partial unique index: only ONE pending (unprocessed) row per original_skill_name
--    Prevents duplicates during extraction phase.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_original_pending ON skills(original_skill_name)
WHERE canonical_skill_name IS NULL;
-- 3. Composite unique index: prevents duplicate (original, canonical) pairs
--    after normalization (allows multiple rows per original with different canonicals).
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_original_canonical ON skills(original_skill_name, canonical_skill_name)
WHERE canonical_skill_name IS NOT NULL;