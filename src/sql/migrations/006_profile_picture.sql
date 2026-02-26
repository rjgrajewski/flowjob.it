-- Migration: Add profile_picture to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_picture TEXT;