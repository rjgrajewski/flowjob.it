-- Allow email/password auth: provider='email', provider_id=email, password_hash for local accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Optional: ensure we can have multiple users with provider='email' (provider_id = email is unique per email)
-- Existing UNIQUE(provider, provider_id) already allows one row per (email, email) for provider='email'.
