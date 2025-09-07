-- Migration: add is_active column to users
-- Up
ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER full_name;

-- Optional: backfill or ensure not null (default handles it)

-- Down (manual rollback)
-- ALTER TABLE users DROP COLUMN is_active;
