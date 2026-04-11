-- Enforce sku_id uniqueness within a period for sku_rows.
--
-- Context: every analysis pillar (P1-P4, M1, M3) assumes sku_id is unique
-- within a period. The Supabase upsert in usePortfolio.saveSku previously
-- used on_conflict=id, which allowed duplicate sku_ids to coexist inside
-- the same period. The app-layer upsert is changed in the same commit to
-- use on_conflict=(period_id, sku_id); this migration adds the matching
-- database-layer constraint so the guarantee is enforced even against
-- bypasses.
--
-- Symmetry note: logistics_rows already has unique_lane_per_period on
-- (period_id, lane_id) - created in 20260329_logistics_rows.sql. Only
-- sku_rows needs the constraint added.

DO $$
DECLARE
  dup_count int;
BEGIN
  -- Pre-flight: abort if any real duplicates exist.
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT period_id, sku_id
    FROM public.sku_rows
    WHERE sku_id IS NOT NULL
    GROUP BY period_id, sku_id
    HAVING COUNT(*) > 1
  ) AS duplicates;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Migration aborted: % duplicate (period_id, sku_id) group(s) found in sku_rows. Resolve manually before applying this constraint.', dup_count;
  END IF;

  RAISE NOTICE 'Pre-flight: 0 duplicates found. Proceeding with constraint creation.';
END $$;

-- Add the UNIQUE constraint. Naming mirrors unique_lane_per_period on
-- logistics_rows for symmetry.
ALTER TABLE public.sku_rows
  ADD CONSTRAINT unique_sku_per_period UNIQUE (period_id, sku_id);

-- Post-flight assertion: confirm the constraint is live.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.sku_rows'::regclass
      AND conname = 'unique_sku_per_period'
      AND contype = 'u'
  ) THEN
    RAISE EXCEPTION 'Post-flight: unique_sku_per_period constraint was not created.';
  END IF;
END $$;
