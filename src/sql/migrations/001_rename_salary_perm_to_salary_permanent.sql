-- Migration: Rename column salary_perm to salary_permanent
-- Date: 2025-10-06
-- Description: Changes the column name from salary_perm to salary_permanent without losing data

ALTER TABLE offers 
RENAME COLUMN salary_perm TO salary_permanent;

