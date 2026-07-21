-- ============================================================================
-- RLS.TRAYVAR_PARITY - WITH CHECK on the last two unconstrained write policies
-- ============================================================================
-- Extends the F-07 work in 20260708140000_rls_hardening.sql to the two policies
-- it missed. A full sweep of all 46 policies on 20 July 2026
-- found exactly these two with a write path and no WITH CHECK:
--
--   teams.team_admin_can_update            (UPDATE, WITH CHECK null)
--   team_invitations.admin_can_manage_...  (ALL,    WITH CHECK null)
--
-- FRAMING: this is a house-style correction, not a new pattern. The twelve
-- division-scoped policies on sku_rows, logistics_rows, periods,
-- trade_investment, action_items and logistics_commercial_investment already
-- carry WITH CHECK on every write path, several deliberately stricter than
-- their USING (the period must belong to your team even where the read allows
-- admin-wide access). These two predate that discipline.
--
-- WHY IT MATTERS, team_invitations especially. USING does not constrain an
-- INSERT at all - only WITH CHECK governs the row being written. So an admin of
-- team A could insert an invitation row carrying team B's team_id, minting an
-- invitation into a team they do not administer. The teams case is narrower but
-- the same class: an UPDATE could move a row to a foreign team_id.
--
-- Postgres has no ALTER POLICY ... ADD WITH CHECK, so each is DROP + CREATE.
-- The USING clauses below are reproduced verbatim from pg_policies as read
-- against production (xdlcglpqyrbknirdjgbg) on 20 July 2026, not paraphrased.
--
-- SCOPE: this migration does GAP 1 only. The SECURITY DEFINER grant grid was
-- audited in the same session and is already correct - helpers granted, all six
-- guard trigger functions revoked from PUBLIC, anon and authenticated by
-- 20260708120000_pentest_profiles_grants.sql and the F-19 block of
-- 20260708140000_rls_hardening.sql. Adding no-op grant statements to a security
-- surface would dirty the diff and invite confusion, so none are included.
--
-- HELPER GRANT ASYMMETRY, DELIBERATELY UNTOUCHED. The grant grid reads oddly at
-- first glance: get_my_team_id and is_team_admin carry EXECUTE for PUBLIC,
-- get_my_division_id does not. That is correct by usage, not an oversight.
-- get_my_team_id and is_team_admin are referenced in the four divisions
-- policies, which are scoped TO public, so their PUBLIC grants are load-bearing
-- - pattern 7 of the Trayvar extraction, where revoking a helper grant makes
-- every policy that calls it fail 42501. get_my_division_id appears only in
-- policies scoped TO authenticated, which anon and authenticated already reach
-- through their direct grants.
--
-- Do not "fix" this in either direction as a ride-along. Granting PUBLIC on
-- get_my_division_id would widen a SECURITY DEFINER surface against the F-19
-- direction this schema set eight days ago; revoking PUBLIC from the other two
-- is the F-19-aligned move but needs staging proof that no TO public policy
-- evaluation fails under a session role outside anon/authenticated. That is
-- logged as RLS.HELPER_GRANT_NARROWING and belongs in its own diagnosed brief.
-- ============================================================================

BEGIN;

-- ── teams.team_admin_can_update ─────────────────────────────────────────────

DROP POLICY team_admin_can_update ON public.teams;
CREATE POLICY team_admin_can_update ON public.teams
  FOR UPDATE TO authenticated
  USING      (id IN ( SELECT team_members.team_id
                        FROM team_members
                       WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))))
  WITH CHECK (id IN ( SELECT team_members.team_id
                        FROM team_members
                       WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))));

-- ── team_invitations.admin_can_manage_invitations ───────────────────────────
--
-- FOR ALL, so the WITH CHECK covers both the INSERT and the UPDATE write path.
-- This is the one that closes the cross-team invitation vector.

DROP POLICY admin_can_manage_invitations ON public.team_invitations;
CREATE POLICY admin_can_manage_invitations ON public.team_invitations
  FOR ALL TO authenticated
  USING      (team_id IN ( SELECT team_members.team_id
                             FROM team_members
                            WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))))
  WITH CHECK (team_id IN ( SELECT team_members.team_id
                             FROM team_members
                            WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))));

COMMIT;

-- ============================================================================
-- ROLLBACK (DOWN) - restores the WITH CHECK-less form
-- ============================================================================
-- Reverts to the pre-migration state exactly, including the vector. Present for
-- reversibility testing on staging, not because reverting is ever desirable.
--
-- BEGIN;
--
-- DROP POLICY team_admin_can_update ON public.teams;
-- CREATE POLICY team_admin_can_update ON public.teams
--   FOR UPDATE TO authenticated
--   USING (id IN ( SELECT team_members.team_id
--                    FROM team_members
--                   WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))));
--
-- DROP POLICY admin_can_manage_invitations ON public.team_invitations;
-- CREATE POLICY admin_can_manage_invitations ON public.team_invitations
--   FOR ALL TO authenticated
--   USING (team_id IN ( SELECT team_members.team_id
--                         FROM team_members
--                        WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = 'admin'::text))));
--
-- COMMIT;
-- ============================================================================
