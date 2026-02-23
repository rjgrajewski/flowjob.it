-- Migration 004: Reorder columns in skills table
-- PostgreSQL does not support ALTER TABLE ... REORDER COLUMNS directly.
-- We recreate the table with the desired column order:
--   uuid, original_skill_name, canonical_skill_name, category, created_at
BEGIN;
-- 1. Create new table with correct column order
CREATE TABLE skills_new (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_skill_name TEXT NOT NULL,
    canonical_skill_name TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Copy all data
INSERT INTO skills_new (
        uuid,
        original_skill_name,
        canonical_skill_name,
        category,
        created_at
    )
SELECT uuid,
    original_skill_name,
    canonical_skill_name,
    category,
    created_at
FROM skills;
-- 3. Drop old table (cascades to offer_skills FK if any)
DROP TABLE skills CASCADE;
-- 4. Rename new table
ALTER TABLE skills_new
    RENAME TO skills;
-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_skills_original_skill_name ON skills(original_skill_name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
-- 6. Recreate partial unique indexes (from migration 002)
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_original_pending ON skills(original_skill_name)
WHERE canonical_skill_name IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_original_canonical ON skills(original_skill_name, canonical_skill_name)
WHERE canonical_skill_name IS NOT NULL;
-- 7. Recreate offer_skills FK (dropped by CASCADE above)
ALTER TABLE offer_skills
ADD CONSTRAINT offer_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(uuid) ON DELETE CASCADE;
COMMIT;