-- Migration: Add show_on_cv to user_skills (key skills to display on CV)
ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS show_on_cv BOOLEAN DEFAULT false;
