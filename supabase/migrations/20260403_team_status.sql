-- Migration: Add status column to teams table for subscription lifecycle management
-- Values: 'active' (normal access), 'suspended' (paywall, data preserved), 'cancelled' (marked for deletion)
-- Run in Supabase SQL Editor before deploying the code changes.

-- Step 1: Add status column with default
ALTER TABLE teams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 2: Add check constraint for valid values
ALTER TABLE teams ADD CONSTRAINT teams_status_check
  CHECK (status IN ('active', 'suspended', 'cancelled'));

-- Step 3: Backfill any NULL rows (shouldn't exist, but be safe)
UPDATE teams SET status = 'active' WHERE status IS NULL;
