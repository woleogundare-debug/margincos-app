-- Migration: Add ON DELETE CASCADE to action_items.period_id FK
-- and sweep legacy orphaned rows (period_id IS NULL).
--
-- Context: logistics_rows and logistics_commercial_investment already have
-- ON DELETE CASCADE on period_id (added in 20260329_* migrations).
-- action_items was missing it, requiring the API to manually delete child rows.
-- With CASCADE in place, deleting a period automatically removes its action_items
-- even if the application-level delete step is skipped.
--
-- Step 1: Remove legacy orphaned rows that were saved before period tracking
-- existed (period_id = NULL). These are unattributed and safe to purge.
DELETE FROM action_items WHERE period_id IS NULL;

-- Step 2: Drop the existing FK constraint on period_id (no CASCADE), if any.
-- The constraint name follows Postgres naming conventions: {table}_{col}_fkey.
ALTER TABLE action_items
  DROP CONSTRAINT IF EXISTS action_items_period_id_fkey;

-- Step 3: Re-add the FK with ON DELETE CASCADE.
-- period_id is now effectively non-null after the DELETE above, but we keep the
-- column nullable to avoid a schema breaking change — a null period_id will
-- simply have no referential constraint to enforce.
ALTER TABLE action_items
  ADD CONSTRAINT action_items_period_id_fkey
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE;
