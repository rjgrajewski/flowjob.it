-- Migration: merge ai_normalized_name + rule_based_normalized_name → canonical_skill_name
-- Run this once against the existing database.
-- 1. Add canonical_skill_name if not already present
ALTER TABLE skills
ADD COLUMN IF NOT EXISTS canonical_skill_name TEXT;
-- 2. Populate canonical_skill_name from ai_normalized_name (primary source)
--    falling back to rule_based_normalized_name if ai is null
UPDATE skills
SET canonical_skill_name = COALESCE(ai_normalized_name, rule_based_normalized_name)
WHERE canonical_skill_name IS NULL
    AND (
        ai_normalized_name IS NOT NULL
        OR rule_based_normalized_name IS NOT NULL
    );
-- 3. Drop the old columns
ALTER TABLE skills DROP COLUMN IF EXISTS ai_normalized_name;
ALTER TABLE skills DROP COLUMN IF EXISTS rule_based_normalized_name;