-- Migration: Add data_processing_clause to user_profiles (GDPR/recruitment consent text on CV)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS data_processing_clause TEXT;
