-- ============================================================
-- Migration: 20260413_teams_sector
-- Purpose:   Make sector a team-level attribute that inherits
--            down to divisions. Closes the architectural gap
--            where sector was only set lazily via
--            ensureDivisionSector on first period creation.
--
-- Rollback:
--   ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_sector_check;
--   ALTER TABLE teams ALTER COLUMN sector DROP NOT NULL;
--   ALTER TABLE teams DROP COLUMN IF EXISTS sector;
-- ============================================================

-- Step 1: Add nullable column
ALTER TABLE teams ADD COLUMN IF NOT EXISTS sector text;

-- Step 2: Backfill existing teams from their divisions' sector values.
-- Each team's sector is set to the most common non-null sector across
-- its divisions. For Carthena Advisory this resolves to 'FMCG'.
UPDATE teams t
SET sector = sub.sector
FROM (
  SELECT DISTINCT ON (d.team_id) d.team_id, d.sector
  FROM divisions d
  WHERE d.sector IS NOT NULL
  GROUP BY d.team_id, d.sector
  ORDER BY d.team_id, count(*) DESC
) sub
WHERE t.id = sub.team_id
  AND t.sector IS NULL;

-- Step 3: Backfill any divisions with null sector from their parent team
UPDATE divisions d
SET sector = t.sector
FROM teams t
WHERE d.team_id = t.id
  AND d.sector IS NULL
  AND t.sector IS NOT NULL;

-- Step 2b: Safety check - fail loud if backfill left any team without a sector
DO $$
DECLARE
  null_team_count integer;
  null_team_ids text;
BEGIN
  SELECT count(*), string_agg(id::text, ', ')
  INTO null_team_count, null_team_ids
  FROM teams
  WHERE sector IS NULL;

  IF null_team_count > 0 THEN
    RAISE EXCEPTION 'Migration cannot proceed: % team(s) have null sector after backfill. Affected teams: %. Set teams.sector manually before re-running this migration.', null_team_count, null_team_ids;
  END IF;
END $$;

-- Step 4: Constraints (only safe after backfill guarantees no nulls)
ALTER TABLE teams ALTER COLUMN sector SET NOT NULL;

ALTER TABLE teams ADD CONSTRAINT teams_sector_check
  CHECK (sector IN ('FMCG', 'Manufacturing', 'Retail', 'Logistics'));
