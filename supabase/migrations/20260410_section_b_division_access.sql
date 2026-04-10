-- ============================================================
-- SECTION B: Division Access Control + Data Integrity Hardening
-- Date: 2026-04-10
-- Author: Section A diagnostic → Section B migration (single-division model)
-- ============================================================
--
-- PRODUCT DECISION: Single-division-per-user.
--   One user belongs to exactly one division (profiles.division_id).
--   No division_members join table.
--
-- This migration addresses findings from Section A diagnostic (Pass 1 + Pass 2):
--   1. Drop dangerous sku_rows anon full-access policy (P0 security)
--   2. Drop 8 redundant user-scoped RLS policies on logistics_rows
--      and logistics_commercial_investment (dead code, dual-policy confusion)
--   3. Checkpoint get_my_team_id() and is_team_admin() into migrations
--      (they exist live but were never committed to git)
--   4. Fix FK cascade behavior on division_id:
--        - 7 division_id FKs: NO ACTION → SET NULL
--          (removes need for useDivisions.deleteDivision NULL-sweep loop)
--      (team_id FKs deliberately left as NO ACTION - see PHASE 3b note)
--   5. Rebuild profiles RLS to use user_id as the authoritative column
--      (kills the join.js id-vs-user_id orphan path)
--   6. Add missing DELETE policy on action_items
--   7. Add UPDATE policy on team_members (enables role changes via RLS)
--   8. Add last-admin guard trigger on team_members
--      (enforces both DELETE and role-demotion UPDATE)
--   9. Backfill profiles.team_id from team_members for stale rows
--  10. Delete orphan sku_rows from pre-period_id schema (cycle_id/client_id era)
-- ============================================================


-- ============================================================
-- PHASE 0: Pre-flight assertions
-- Fail fast if the schema doesn't match what Section A observed
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'divisions'
  ) THEN
    RAISE EXCEPTION 'Pre-flight FAIL: divisions table missing (run 20260331 first)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_members'
  ) THEN
    RAISE EXCEPTION 'Pre-flight FAIL: team_members table missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'division_id'
  ) THEN
    RAISE EXCEPTION 'Pre-flight FAIL: profiles.division_id missing (run 20260331 first)';
  END IF;

  RAISE NOTICE 'Section B pre-flight checks OK';
END $$;


-- ============================================================
-- PHASE 1: Checkpoint security definer helpers
-- These exist in the live DB but were never committed to git.
-- CREATE OR REPLACE is idempotent and safe.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_team_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;


-- ============================================================
-- PHASE 2: Drop dangerous and redundant RLS policies
-- ============================================================

-- 2a. CRITICAL: Drop sku_rows anon-full-access policy
-- Current state: PERMISSIVE ALL on role {anon} with qual=true, with_check=true
-- Effect: any unauthenticated request can read/write/delete every sku_row
-- Verified no app code depends on it (all sku_rows access goes through
-- authenticated browser client or service role).
DROP POLICY IF EXISTS "sku_rows" ON sku_rows;

-- 2b. Drop 4 redundant user-scoped policies on logistics_rows
-- The team_data_access ALL policy already OR's in user_id = auth.uid()::text,
-- so these are dead weight that create dual-policy maintenance risk.
DROP POLICY IF EXISTS "Users can delete own logistics data" ON logistics_rows;
DROP POLICY IF EXISTS "Users can insert own logistics data" ON logistics_rows;
DROP POLICY IF EXISTS "Users can read own logistics data"   ON logistics_rows;
DROP POLICY IF EXISTS "Users can update own logistics data" ON logistics_rows;

-- 2c. Same cleanup for logistics_commercial_investment
DROP POLICY IF EXISTS "Users can delete own logistics investment data" ON logistics_commercial_investment;
DROP POLICY IF EXISTS "Users can insert own logistics investment data" ON logistics_commercial_investment;
DROP POLICY IF EXISTS "Users can read own logistics investment data"   ON logistics_commercial_investment;
DROP POLICY IF EXISTS "Users can update own logistics investment data" ON logistics_commercial_investment;

-- 2d. Drop legacy profiles policies (rebuilt in PHASE 5)
-- Current state mixes id = auth.uid() and user_id = auth.uid()::text checks,
-- which is why join.js was forced to write profiles.id and data drifted.
DROP POLICY IF EXISTS "own_profile_only"    ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;


-- ============================================================
-- PHASE 3: Fix FK cascade behavior
-- ============================================================

-- 3a. All division_id FKs: NO ACTION → SET NULL
-- This lets Postgres handle division deletion cleanly, removing the
-- need for useDivisions.deleteDivision's client-side NULL-sweep loop
-- (which was dangerous under team-scoped RLS anyway).

ALTER TABLE periods
  DROP CONSTRAINT IF EXISTS periods_division_id_fkey,
  ADD CONSTRAINT periods_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_division_id_fkey,
  ADD CONSTRAINT profiles_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE sku_rows
  DROP CONSTRAINT IF EXISTS sku_rows_division_id_fkey,
  ADD CONSTRAINT sku_rows_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE logistics_rows
  DROP CONSTRAINT IF EXISTS logistics_rows_division_id_fkey,
  ADD CONSTRAINT logistics_rows_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE trade_investment
  DROP CONSTRAINT IF EXISTS trade_investment_division_id_fkey,
  ADD CONSTRAINT trade_investment_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE logistics_commercial_investment
  DROP CONSTRAINT IF EXISTS logistics_commercial_investment_division_id_fkey,
  ADD CONSTRAINT logistics_commercial_investment_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

ALTER TABLE action_items
  DROP CONSTRAINT IF EXISTS action_items_division_id_fkey,
  ADD CONSTRAINT action_items_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

-- 3b. DEFERRED: periods.team_id and profiles.team_id stay NO ACTION.
--
-- Originally planned to change to CASCADE for consistency with the other
-- team_id FKs (team_members, divisions, team_invitations, action_items).
-- Reverted because it would conflict with the last-admin guard trigger
-- added in PHASE 8: a cascaded team delete would fire the trigger on
-- the last admin's team_members row and abort the transaction.
--
-- Since team deletion is not a product feature today (no DELETE policy
-- on the teams table), leaving these FKs as NO ACTION is safer. When
-- team deletion gets built, the delete-team API should:
--   (a) use the service role client,
--   (b) set a session-local bypass flag the trigger checks, or
--   (c) manually clear periods + profiles before deleting the team.


-- ============================================================
-- PHASE 4: Archive + clean up legacy schema debris
-- ============================================================
-- Section A.2 confirmed 59 rows match this shape: period_id IS NULL,
-- cycle_id IS NOT NULL, client_id IS NOT NULL. They reference clients
-- and upload_cycles tables that are no longer used, and have no path
-- to appear in the UI (usePortfolio requires period_id).
--
-- Safety design (per review):
--   1. Create an archive table (same shape as sku_rows + metadata)
--   2. Pre-delete sanity check: orphan count must be in expected 40-80 window
--   3. Archive the orphans before deleting
--   4. Delete the orphans
--   5. Post-flight in PHASE 11 asserts zero orphans remain
--
-- Recovery: if we later discover these rows were needed,
--   INSERT INTO sku_rows SELECT <cols> FROM _archive_sku_rows_section_b_20260410;

-- 4a. Create archive table (empty, same shape as sku_rows + metadata)
-- Idempotent via IF NOT EXISTS: re-runs will reuse the existing archive.
CREATE TABLE IF NOT EXISTS _archive_sku_rows_section_b_20260410 AS
  SELECT sku_rows.*,
         now()::timestamptz AS archived_at,
         'Section B 20260410 - pre period_id schema cleanup'::text AS archived_reason
  FROM sku_rows WHERE false;

-- 4b. Pre-delete sanity check
DO $$
DECLARE
  orphan_count integer;
BEGIN
  SELECT count(*) INTO orphan_count
  FROM sku_rows
  WHERE period_id IS NULL AND cycle_id IS NOT NULL;

  IF orphan_count = 0 THEN
    RAISE NOTICE 'Pre-delete: no orphan sku_rows found (already clean or re-run)';
  ELSIF orphan_count < 40 OR orphan_count > 80 THEN
    RAISE EXCEPTION 'Pre-delete FAIL: orphan_count=% outside expected 40-80 window (diagnostic saw 59)',
      orphan_count;
  ELSE
    RAISE NOTICE 'Pre-delete orphan count: % (expected 59)', orphan_count;
  END IF;
END $$;

-- 4c. Archive before delete (idempotent: re-runs insert 0 rows because the
-- DELETE in 4d already removed them; if the migration is re-run against a
-- fresh snapshot, archived_at will be the later timestamp).
INSERT INTO _archive_sku_rows_section_b_20260410
  SELECT sku_rows.*,
         now(),
         'Section B 20260410'
  FROM sku_rows
  WHERE period_id IS NULL AND cycle_id IS NOT NULL;

-- 4d. Delete the orphans
DELETE FROM sku_rows
WHERE period_id IS NULL
  AND cycle_id IS NOT NULL;


-- ============================================================
-- PHASE 5: Rebuild profiles RLS with user_id as the canonical column
-- ============================================================
-- Design:
--   - SELECT/UPDATE: own profile via user_id = auth.uid()::text
--   - INSERT: only with user_id = auth.uid()::text (kills the join.js
--     id-only path that was silently inserting malformed rows)
--   - Team admins can SELECT and UPDATE profiles in their own team
--     (needed for the team page member list and division assignment)

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (auth.uid())::text)
  WITH CHECK (user_id = (auth.uid())::text);

-- Team members can read each other's profiles (for the team page roster).
-- This policy supersedes any "admin-only read" pattern because members
-- need names and emails to appear in the UI regardless of their role.
-- get_my_team_id() is SECURITY DEFINER, so it bypasses RLS on team_members.
CREATE POLICY "profiles_team_members_read" ON profiles
  FOR SELECT
  TO authenticated
  USING (team_id = get_my_team_id());

-- Team admins can update profiles of members in their own team.
-- Used for division assignment; team_id itself stays immutable via this path
-- (the WITH CHECK forces the new team_id to still match get_my_team_id()).
CREATE POLICY "profiles_team_admin_update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (team_id = get_my_team_id() AND is_team_admin())
  WITH CHECK (team_id = get_my_team_id() AND is_team_admin());


-- ============================================================
-- PHASE 6: Add missing action_items DELETE policy
-- ============================================================
-- Current state has SELECT/INSERT/UPDATE but no DELETE.
-- Soft-deletes via status = 'resolved' work, but the periods/delete.js
-- orphan sweep (action_items WHERE period_id IS NULL) was silently failing.
CREATE POLICY "action_items_delete" ON action_items
  FOR DELETE
  TO authenticated
  USING (team_id = get_my_team_id());


-- ============================================================
-- PHASE 7: team_members UPDATE policy (enables role changes via RLS)
-- ============================================================
-- Existing policies cover DELETE and INSERT by admin. Role changes were
-- impossible through the anon/authenticated client because no UPDATE
-- policy existed. Add one with the same admin gate.
CREATE POLICY "admin_can_update_members" ON team_members
  FOR UPDATE
  TO authenticated
  USING (team_id = get_my_team_id() AND is_team_admin())
  WITH CHECK (team_id = get_my_team_id() AND is_team_admin());


-- ============================================================
-- PHASE 8: Last-admin guard trigger
-- ============================================================
-- Enforces invariant: every team with any members must have at least
-- one admin. Fires BEFORE DELETE and BEFORE UPDATE (when role changes
-- from admin to non-admin). Raises a friendly error the UI can catch.

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      SELECT count(*) INTO admin_count
      FROM team_members
      WHERE team_id = OLD.team_id
        AND role = 'admin'
        AND id <> OLD.id;
      IF admin_count = 0 THEN
        RAISE EXCEPTION 'Cannot remove the last admin from team %', OLD.team_id
          USING ERRCODE = 'check_violation',
                HINT = 'Promote another member to admin first, then remove this one.';
      END IF;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT count(*) INTO admin_count
      FROM team_members
      WHERE team_id = OLD.team_id
        AND role = 'admin'
        AND id <> OLD.id;
      IF admin_count = 0 THEN
        RAISE EXCEPTION 'Cannot demote the last admin of team %', OLD.team_id
          USING ERRCODE = 'check_violation',
                HINT = 'Promote another member to admin first, then change this role.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enforce_last_admin ON team_members;
CREATE TRIGGER enforce_last_admin
  BEFORE DELETE OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_removal();


-- ============================================================
-- PHASE 9: Data backfill
-- ============================================================

-- 9a. Backfill profiles.team_id from team_members
-- Section A Pass 2 found 1 profile row (Wole's dev account) with team_id NULL
-- despite having an active team_members row. The useAuth.js fallback masked it.
-- This is the fix.
UPDATE profiles p
SET team_id = tm.team_id,
    updated_at = now()
FROM team_members tm
WHERE p.user_id = tm.user_id::text
  AND p.team_id IS NULL;


-- ============================================================
-- PHASE 10: Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_team_id
  ON profiles(team_id)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_division_id
  ON profiles(division_id)
  WHERE division_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_user_id
  ON team_members(user_id);


-- ============================================================
-- PHASE 11: Post-flight assertions
-- Raise exceptions if any of the intended outcomes are not in place.
-- ============================================================
DO $$
DECLARE
  anon_sku_policy_count        integer;
  orphan_sku_count             integer;
  null_team_profile_count      integer;
  missing_update_policy_count  integer;
  missing_action_delete_policy integer;
  trigger_exists               boolean;
BEGIN
  -- The anon sku_rows policy must be gone
  SELECT count(*) INTO anon_sku_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'sku_rows'
    AND 'anon' = ANY(roles::text[]);
  IF anon_sku_policy_count > 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: sku_rows still has anon policy';
  END IF;

  -- Orphan sku_rows must be gone
  SELECT count(*) INTO orphan_sku_count
  FROM sku_rows
  WHERE period_id IS NULL AND cycle_id IS NOT NULL;
  IF orphan_sku_count > 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: % orphan sku_rows remain', orphan_sku_count;
  END IF;

  -- Profiles with a team_members row must have team_id set
  SELECT count(*) INTO null_team_profile_count
  FROM profiles p
  WHERE p.team_id IS NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm WHERE tm.user_id::text = p.user_id
    );
  IF null_team_profile_count > 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: % profiles still have NULL team_id despite team_members row',
      null_team_profile_count;
  END IF;

  -- team_members UPDATE policy must exist
  SELECT count(*) INTO missing_update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'team_members'
    AND cmd = 'UPDATE';
  IF missing_update_policy_count = 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: team_members UPDATE policy missing';
  END IF;

  -- action_items DELETE policy must exist
  SELECT count(*) INTO missing_action_delete_policy
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'action_items'
    AND cmd = 'DELETE';
  IF missing_action_delete_policy = 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: action_items DELETE policy missing';
  END IF;

  -- Last-admin trigger must exist
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_last_admin'
      AND tgrelid = 'public.team_members'::regclass
  ) INTO trigger_exists;
  IF NOT trigger_exists THEN
    RAISE EXCEPTION 'Post-flight FAIL: enforce_last_admin trigger missing';
  END IF;

  RAISE NOTICE 'Section B post-flight checks PASSED';
END $$;


-- ============================================================
-- Section B complete.
-- Next: application code edits (join.js, useTeam.js, team.js, useDivisions.js).
-- ============================================================
