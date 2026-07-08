-- ============================================================================
-- RLS.HARDENING - explicit WITH CHECK + deny_all + RPC-surface revoke
-- ============================================================================
-- Three defense-in-depth hardenings from the FMN audit. None is a live hole
-- (tenant-move is already blocked; upload_cycles already denies by default;
-- the SECURITY DEFINER surface is clean). This makes the protections explicit.
--
--   F-07  Make the write constraint explicit on three policies that currently
--         inherit it from USING (Postgres default). Behaviour is unchanged.
--   F-09  Explicit deny_all on upload_cycles (service-role only). Silences the
--         rls_enabled_no_policy advisor and documents intent in the schema.
--   F-19  Revoke EXECUTE on five trigger functions from anon/authenticated.
--         Triggers fire as the table owner, so this is zero-impact; it only
--         removes pointless PostgREST RPC surface.
--
-- Staging verification (2026-07-08, hxwjhvmesyiqiwgdgmvu): tenant-move exploits
-- rejected before and after; deny_all keeps authenticated at 0 rows; the tier
-- trigger still fires after the revoke; direct RPC call is denied.
-- ============================================================================

-- ── F-07: explicit WITH CHECK matching USING ────────────────────────────────

DROP POLICY divisions_update ON public.divisions;
CREATE POLICY divisions_update ON public.divisions
  FOR UPDATE TO public
  USING      (team_id IN (SELECT tm.team_id FROM public.team_members tm
                          WHERE tm.user_id = auth.uid() AND tm.role = 'admin'))
  WITH CHECK (team_id IN (SELECT tm.team_id FROM public.team_members tm
                          WHERE tm.user_id = auth.uid() AND tm.role = 'admin'));

DROP POLICY own_data_only ON public.analysis_results;
CREATE POLICY own_data_only ON public.analysis_results
  FOR ALL TO authenticated
  USING      ((auth.uid())::text = user_id)
  WITH CHECK ((auth.uid())::text = user_id);

DROP POLICY own_data_only ON public.clients;
CREATE POLICY own_data_only ON public.clients
  FOR ALL TO authenticated
  USING      ((auth.uid())::text = user_id)
  WITH CHECK ((auth.uid())::text = user_id);

-- ── F-09: explicit deny_all on upload_cycles (service-role only) ─────────────

CREATE POLICY deny_all ON public.upload_cycles
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- ── F-19: revoke RPC surface on trigger functions ───────────────────────────

-- NOTE: EXECUTE on these functions is granted to PUBLIC (the Supabase default),
-- which anon/authenticated inherit. Revoking only anon/authenticated is a no-op
-- because the PUBLIC grant remains; we must revoke PUBLIC. service_role and the
-- owner keep their explicit grants, so triggers are unaffected.
REVOKE EXECUTE ON FUNCTION public.enforce_period_sector_inheritance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_tier_limit()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_teams_tier()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_removal()        FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- ROLLBACK (down migration)
-- ----------------------------------------------------------------------------
-- -- F-07: restore the implicit-WITH-CHECK policies (USING only)
-- DROP POLICY divisions_update ON public.divisions;
-- CREATE POLICY divisions_update ON public.divisions FOR UPDATE TO public
--   USING (team_id IN (SELECT tm.team_id FROM public.team_members tm
--                      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'));
-- DROP POLICY own_data_only ON public.analysis_results;
-- CREATE POLICY own_data_only ON public.analysis_results FOR ALL TO authenticated
--   USING ((auth.uid())::text = user_id);
-- DROP POLICY own_data_only ON public.clients;
-- CREATE POLICY own_data_only ON public.clients FOR ALL TO authenticated
--   USING ((auth.uid())::text = user_id);
-- -- F-09
-- DROP POLICY deny_all ON public.upload_cycles;
-- -- F-19
-- GRANT EXECUTE ON FUNCTION public.enforce_period_sector_inheritance() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.enforce_tier_limit()                TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.guard_profiles_privileged_columns() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.guard_teams_tier()                  TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.prevent_last_admin_removal()        TO PUBLIC;
-- ============================================================================
