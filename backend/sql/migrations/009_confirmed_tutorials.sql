-- Migration: Add confirmed_tutorials to users (flags for JIT swipe tutorial)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS confirmed_tutorials TEXT[] DEFAULT '{}';
