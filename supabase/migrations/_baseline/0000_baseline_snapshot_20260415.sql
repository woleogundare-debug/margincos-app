-- =============================================================================
-- 0000_baseline_snapshot_20260415.sql
-- =============================================================================
-- BASELINE SCHEMA SNAPSHOT for MarginCOS
--
-- Captured: 2026-04-15
-- Source:   Production Supabase project xdlcglpqyrbknirdjgbg
-- Region:   us-east-2
-- Postgres: 17.6.1.063
-- Org:      ycdrikmssfqfmhrasolr
--
-- This file is a SNAPSHOT, not a forward migration. It captures the state of
-- the production schema as of 2026-04-15, after the following 4 migrations
-- had already been applied directly via the Supabase dashboard:
--
--   20260410220003  section_b_division_access
--   20260411170734  gap1_division_aware_rls
--   20260411172815  gap1_narrow_write_policies_drop_self_escape_hatch
--   20260411192812  20260411_sku_rows_unique_constraint
--
-- PURPOSE
--   - Bootstrap empty Supabase projects (e.g. staging, future DR)
--   - Serve as the canonical version-controlled record of schema state
--
-- This file is NOT designed to re-run against production. Production was
-- not created from this file; it evolved through dashboard SQL and the
-- 4 migrations above.
--
-- GOING FORWARD
--   All schema changes from this commit onward MUST be added as new
--   timestamped migration files in supabase/migrations/ following the
--   Supabase convention YYYYMMDDHHMMSS_descriptive_name.sql. Apply to
--   staging first, production second. No more direct dashboard SQL on
--   production.
--
-- INTENTIONAL EXCLUSIONS
--   - public._archive_sku_rows_section_b_20260410 (one-off archive table
--     containing real production data; not part of the schema baseline)
--   - Supabase-managed extensions (pg_stat_statements, supabase_vault,
--     pg_graphql) - these ship pre-installed on every Supabase project
-- =============================================================================


-- =============================================================================
-- SECTION 1: Application-required extensions
-- =============================================================================
-- Note: pg_stat_statements, supabase_vault, pg_graphql ship by default with
-- Supabase. Only application-required extensions are declared here.

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


-- =============================================================================
-- SECTION 2: Tables (in dependency order - parents before children)
-- =============================================================================
-- Order rationale:
--   1. teams                              (depends on auth.users)
--   2. divisions                          (FK to teams)
--   3. profiles                           (FK to teams, divisions)
--   4. team_members                       (FK to teams, auth.users)
--   5. team_invitations                   (FK to teams, auth.users)
--   6. periods                            (FK to teams, divisions, auth.users)
--   7. action_items                       (FK to teams, periods, divisions)
--   8. clients                            (no public FKs)
--   9. upload_cycles                      (FK to clients)
--  10. sku_rows                           (FK to clients, upload_cycles, periods, divisions)
--  11. analysis_results                   (FK to clients, upload_cycles)
--  12. trade_investment                   (FK to periods, divisions, auth.users)
--  13. logistics_rows                     (FK to periods, divisions)
--  14. logistics_commercial_investment    (FK to periods, divisions)
--  15. contact_submissions                (standalone)


-- ----- 1. teams -----
CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tier        text NOT NULL DEFAULT 'essentials'
              CHECK (tier = ANY (ARRAY['essentials','professional','enterprise'])),
  created_at  timestamptz DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  status      text DEFAULT 'active'
              CHECK (status = ANY (ARRAY['active','suspended','cancelled'])),
  sector      text NOT NULL
              CHECK (sector = ANY (ARRAY['FMCG','Manufacturing','Retail','Logistics']))
);


-- ----- 2. divisions -----
CREATE TABLE IF NOT EXISTS public.divisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sector        text,
  is_default    boolean DEFAULT false,
  is_archived   boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT divisions_team_id_name_key UNIQUE (team_id, name)
);


-- ----- 3. profiles -----
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL UNIQUE,
  email           text NOT NULL,
  company_name    text,
  tier            text NOT NULL DEFAULT 'essentials'
                  CHECK (tier = ANY (ARRAY['essentials','professional','enterprise'])),
  is_admin        boolean NOT NULL DEFAULT false,
  upload_count    integer NOT NULL DEFAULT 0,
  last_upload_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  vertical        text CHECK (vertical = ANY (ARRAY['Retail','FMCG','Manufacturing'])),
  team_id         uuid REFERENCES public.teams(id),
  full_name       text,
  is_superadmin   boolean DEFAULT false,
  division_id     uuid REFERENCES public.divisions(id) ON DELETE SET NULL
);


-- ----- 4. team_members -----
CREATE TABLE IF NOT EXISTS public.team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member'
              CHECK (role = ANY (ARRAY['admin','member'])),
  invited_by  uuid REFERENCES auth.users(id),
  joined_at   timestamptz DEFAULT now(),
  CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id)
);


-- ----- 5. team_invitations -----
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL DEFAULT 'member',
  token        text UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  invited_by   uuid REFERENCES auth.users(id),
  accepted_at  timestamptz,
  expires_at   timestamptz DEFAULT (now() + interval '7 days'),
  created_at   timestamptz DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending'
);


-- ----- 6. periods -----
CREATE TABLE IF NOT EXISTS public.periods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label         text NOT NULL,
  vertical      text NOT NULL DEFAULT 'fmcg',
  company_name  text,
  is_active     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  team_id       uuid REFERENCES public.teams(id),
  division_id   uuid REFERENCES public.divisions(id) ON DELETE SET NULL
);


-- ----- 7. action_items -----
CREATE TABLE IF NOT EXISTS public.action_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  period_id        uuid REFERENCES public.periods(id) ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  title            text NOT NULL,
  detail           text,
  pillar           text NOT NULL,
  urgency          text,
  value            numeric,
  owner_name       text,
  due_date         date,
  status           text NOT NULL DEFAULT 'open',
  resolved_at      timestamptz,
  resolution_note  text,
  division_id      uuid REFERENCES public.divisions(id) ON DELETE SET NULL
);


-- ----- 8. clients -----
CREATE TABLE IF NOT EXISTS public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL UNIQUE,
  email         text NOT NULL,
  company_name  text,
  tier          text DEFAULT 'essentials',
  created_at    timestamptz DEFAULT now()
);


-- ----- 9. upload_cycles -----
CREATE TABLE IF NOT EXISTS public.upload_cycles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id       text NOT NULL,
  filename      text,
  sku_count     integer,
  period_label  text,
  uploaded_at   timestamptz DEFAULT now(),
  status        text DEFAULT 'complete'
);


-- ----- 10. sku_rows -----
CREATE TABLE IF NOT EXISTS public.sku_rows (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id                    uuid REFERENCES public.upload_cycles(id) ON DELETE CASCADE,
  client_id                   uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id                     text NOT NULL,
  sku_id                      text,
  sku_name                    text,
  category                    text,
  segment                     text,
  business_unit               text,
  region                      text,
  primary_channel             text,
  channel_revenue_split       text,
  active                      text,
  rrp                         numeric,
  cogs_per_unit               numeric,
  gross_margin_pct            numeric,
  monthly_volume_units        numeric,
  monthly_revenue             numeric,
  price_elasticity            numeric,
  proposed_price_change_pct   numeric,
  wtp_premium_pct             numeric,
  cogs_inflation_rate         numeric,
  pass_through_rate           numeric,
  distributor_margin_pct      numeric,
  promo_depth_pct             numeric,
  promo_lift_pct              numeric,
  period_id                   uuid REFERENCES public.periods(id) ON DELETE CASCADE,
  distributor_name            text,
  competitor_price            numeric,
  target_margin_floor_pct     numeric,
  fx_exposure_pct             numeric,
  cogs_prior_period           numeric,
  logistics_cost_per_unit     numeric,
  trade_rebate_pct            numeric,
  credit_days                 integer,
  division_id                 uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
  CONSTRAINT unique_sku_per_period UNIQUE (period_id, sku_id)
);


-- ----- 11. analysis_results -----
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id               uuid REFERENCES public.upload_cycles(id) ON DELETE CASCADE,
  client_id              uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id                text NOT NULL,
  period_label           text,
  protected_margin       numeric,
  revenue_at_risk        numeric,
  price_realisation      numeric,
  dist_exposure          numeric,
  p1_results             jsonb,
  p2_results             jsonb,
  p3_results             jsonb,
  p4_results             jsonb,
  actions                jsonb,
  sku_count              integer,
  total_skus             integer,
  p1_total_gain          numeric,
  total_wtp_gap          numeric,
  total_absorbed         numeric,
  total_cost_shock       numeric,
  total_promo_impact     numeric,
  total_current_margin   numeric,
  total_revenue          numeric,
  created_at             timestamptz DEFAULT now()
);


-- ----- 12. trade_investment -----
CREATE TABLE IF NOT EXISTS public.trade_investment (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id           uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  channel             text NOT NULL,
  listing_fees        numeric DEFAULT 0,
  coop_spend          numeric DEFAULT 0,
  activation_budget   numeric DEFAULT 0,
  gondola_payments    numeric DEFAULT 0,
  other_trade_spend   numeric DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  division_id         uuid REFERENCES public.divisions(id) ON DELETE SET NULL
);


-- ----- 13. logistics_rows -----
CREATE TABLE IF NOT EXISTS public.logistics_rows (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     text NOT NULL,
  period_id                   uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  lane_id                     text NOT NULL,
  lane_name                   text NOT NULL,
  route_region                text,
  cargo_type                  text,
  fleet_division              text,
  active                      text DEFAULT 'Y',
  contracted_rate_ngn         numeric,
  fully_loaded_cost_ngn       numeric,
  distance_km                 numeric,
  market_rate_ngn             numeric,
  rate_sensitivity            numeric,
  proposed_rate_change_pct    numeric,
  min_margin_floor_pct        numeric,
  rate_headroom_pct           numeric,
  return_lane_id              text,
  backhaul_rate_ngn           numeric,
  backhaul_cost_ngn           numeric,
  backhaul_recovery_pct       numeric,
  fuel_cost_per_km            numeric,
  driver_cost_per_trip        numeric,
  maintenance_cost_per_trip   numeric,
  toll_levy_per_trip          numeric,
  cost_inflation_pct          numeric,
  pass_through_rate           numeric,
  prior_period_cost_ngn       numeric,
  fx_exposure_pct             numeric,
  truck_id                    text,
  truck_type                  text,
  contract_type               text,
  customer_name               text,
  customer_margin_pct         numeric,
  rebate_pct                  numeric,
  payment_terms_days          numeric,
  fuel_surcharge_clause       text,
  monthly_trips               numeric,
  discount_depth_pct          numeric,
  volume_response_pct         numeric,
  operating_region            text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),
  division_id                 uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
  CONSTRAINT unique_lane_per_period UNIQUE (period_id, lane_id)
);


-- ----- 14. logistics_commercial_investment -----
CREATE TABLE IF NOT EXISTS public.logistics_commercial_investment (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id                  uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  user_id                    text NOT NULL,
  contract_type              text NOT NULL,
  volume_rebates             numeric DEFAULT 0,
  fuel_surcharge_waivers     numeric DEFAULT 0,
  rate_holddowns             numeric DEFAULT 0,
  deadhead_absorption        numeric DEFAULT 0,
  credit_extension_cost      numeric DEFAULT 0,
  fleet_dedication_premium   numeric DEFAULT 0,
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now(),
  division_id                uuid REFERENCES public.divisions(id) ON DELETE SET NULL
);


-- ----- 15. contact_submissions -----
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  company     text NOT NULL,
  role        text NOT NULL,
  revenue     text,
  message     text,
  created_at  timestamptz DEFAULT now()
);


-- =============================================================================
-- SECTION 3: Functions
-- =============================================================================
-- Created AFTER tables because the security definer functions query
-- profiles and team_members.

-- ----- handle_updated_at: trigger function for updated_at columns -----
CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;


-- ----- get_my_team_id: SECURITY DEFINER, used by RLS -----
CREATE OR REPLACE FUNCTION public.get_my_team_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;


-- ----- get_my_division_id: SECURITY DEFINER, used by division-aware RLS -----
CREATE OR REPLACE FUNCTION public.get_my_division_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT division_id FROM profiles WHERE user_id = (auth.uid())::text LIMIT 1;
$function$;


-- ----- is_team_admin: SECURITY DEFINER, used by RLS -----
CREATE OR REPLACE FUNCTION public.is_team_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$;


-- ----- prevent_last_admin_removal: trigger function guarding team_members -----
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  admin_count integer;
BEGIN
  -- Bypass guard during administrative cascade deletions.
  -- The flag is set by admin_cascade_delete_team() and is
  -- transaction-local (auto-clears on commit/rollback).
  IF current_setting('margincos.cascade_delete', true) = 'true' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD;
    ELSE RETURN NEW;
    END IF;
  END IF;

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
$function$;


-- ----- admin_cascade_delete_team: SECURITY DEFINER, admin panel cascade -----
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_team(p_team_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Defense-in-depth: if called via user JWT context (not service role),
  -- require superadmin. auth.uid() is NULL for service-role calls.
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()::text AND is_superadmin = true
    ) THEN
      RAISE EXCEPTION 'Access denied: superadmin required'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Set transaction-local flag to bypass enforce_last_admin trigger
  PERFORM set_config('margincos.cascade_delete', 'true', true);

  -- Delete team; FK CASCADE handles team_members, divisions, team_invitations
  DELETE FROM teams WHERE id = p_team_id;
END;
$function$;


-- =============================================================================
-- SECTION 4: Indexes (custom, beyond auto-created from PK/UNIQUE constraints)
-- =============================================================================

-- action_items
CREATE INDEX IF NOT EXISTS action_items_period_id_idx ON public.action_items USING btree (period_id);
CREATE INDEX IF NOT EXISTS action_items_status_idx    ON public.action_items USING btree (status);
CREATE INDEX IF NOT EXISTS action_items_team_id_idx   ON public.action_items USING btree (team_id);
-- NOTE: idx_action_items_period_id is a duplicate of action_items_period_id_idx in production.
-- Replicated here for fidelity. Production cleanup pending.
CREATE INDEX IF NOT EXISTS idx_action_items_period_id ON public.action_items USING btree (period_id);

-- analysis_results
CREATE INDEX IF NOT EXISTS idx_analysis_results_created    ON public.analysis_results USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_netlify_id ON public.analysis_results USING btree (user_id);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_netlify_id ON public.clients USING btree (user_id);

-- divisions
CREATE INDEX IF NOT EXISTS idx_divisions_team_id ON public.divisions USING btree (team_id);

-- logistics_commercial_investment
CREATE INDEX IF NOT EXISTS idx_logistics_ci_period ON public.logistics_commercial_investment USING btree (period_id);
CREATE INDEX IF NOT EXISTS idx_logistics_ci_user   ON public.logistics_commercial_investment USING btree (user_id);

-- logistics_rows
CREATE INDEX IF NOT EXISTS idx_logistics_rows_division_id ON public.logistics_rows USING btree (division_id);
CREATE INDEX IF NOT EXISTS idx_logistics_rows_period      ON public.logistics_rows USING btree (period_id);
CREATE INDEX IF NOT EXISTS idx_logistics_rows_user        ON public.logistics_rows USING btree (user_id);

-- periods
CREATE INDEX IF NOT EXISTS idx_periods_division_id ON public.periods USING btree (division_id);
CREATE INDEX IF NOT EXISTS idx_periods_team_id     ON public.periods USING btree (team_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_division_id          ON public.profiles USING btree (division_id) WHERE (division_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id              ON public.profiles USING btree (team_id) WHERE (team_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS profiles_netlify_user_id_idx      ON public.profiles USING btree (user_id);

-- sku_rows
CREATE INDEX IF NOT EXISTS idx_sku_rows_cycle_id      ON public.sku_rows USING btree (cycle_id);
CREATE INDEX IF NOT EXISTS idx_sku_rows_division_id   ON public.sku_rows USING btree (division_id);
CREATE INDEX IF NOT EXISTS idx_sku_rows_netlify_id    ON public.sku_rows USING btree (user_id);

-- team_members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members USING btree (user_id);

-- upload_cycles
CREATE INDEX IF NOT EXISTS idx_upload_cycles_client_id  ON public.upload_cycles USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_upload_cycles_netlify_id ON public.upload_cycles USING btree (user_id);


-- =============================================================================
-- SECTION 5: RLS enable + policies
-- =============================================================================
-- 13 tables with RLS enabled, 44 policies total.

-- ----- Enable RLS on all application tables -----
ALTER TABLE public.action_items                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_commercial_investment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_rows                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_rows                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_investment                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_cycles                    ENABLE ROW LEVEL SECURITY;


-- ----- action_items policies -----
CREATE POLICY "action_items_delete_division" ON public.action_items
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "action_items_insert_division" ON public.action_items
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "action_items_select_division" ON public.action_items
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "action_items_update_division" ON public.action_items
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())))
  WITH CHECK ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- ----- analysis_results policies -----
CREATE POLICY "own_data_only" ON public.analysis_results
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.uid())::text = user_id);


-- ----- clients policies -----
CREATE POLICY "own_data_only" ON public.clients
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.uid())::text = user_id);


-- ----- contact_submissions policies -----
CREATE POLICY "anon_insert" ON public.contact_submissions
  AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (true);


-- ----- divisions policies -----
CREATE POLICY "divisions_delete" ON public.divisions
  AS PERMISSIVE FOR DELETE TO public
  USING (team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.role = 'admin'));

CREATE POLICY "divisions_insert" ON public.divisions
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.role = 'admin'));

CREATE POLICY "divisions_select" ON public.divisions
  AS PERMISSIVE FOR SELECT TO public
  USING (team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()));

CREATE POLICY "divisions_update" ON public.divisions
  AS PERMISSIVE FOR UPDATE TO public
  USING (team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.role = 'admin'));


-- ----- logistics_commercial_investment policies -----
CREATE POLICY "lci_delete_division" ON public.logistics_commercial_investment
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()));

CREATE POLICY "lci_insert_division" ON public.logistics_commercial_investment
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "lci_select_division" ON public.logistics_commercial_investment
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR (user_id = (auth.uid())::text)
    OR (division_id = get_my_division_id())
    OR ((division_id IS NULL) AND (period_id IN (
      SELECT periods.id FROM periods
      WHERE is_team_admin() OR (periods.user_id = auth.uid()) OR (periods.division_id = get_my_division_id())
    )))
  );

CREATE POLICY "lci_update_division" ON public.logistics_commercial_investment
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()))
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- ----- logistics_rows policies -----
CREATE POLICY "logistics_rows_delete_division" ON public.logistics_rows
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()));

CREATE POLICY "logistics_rows_insert_division" ON public.logistics_rows
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "logistics_rows_select_division" ON public.logistics_rows
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR (user_id = (auth.uid())::text)
    OR (division_id = get_my_division_id())
    OR ((division_id IS NULL) AND (period_id IN (
      SELECT periods.id FROM periods
      WHERE is_team_admin() OR (periods.user_id = auth.uid()) OR (periods.division_id = get_my_division_id())
    )))
  );

CREATE POLICY "logistics_rows_update_division" ON public.logistics_rows
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()))
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- ----- periods policies -----
CREATE POLICY "periods_delete_division" ON public.periods
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()));

CREATE POLICY "periods_insert_division" ON public.periods
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "periods_select_division" ON public.periods
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_team_admin() OR (user_id = auth.uid()) OR (division_id = get_my_division_id()));

CREATE POLICY "periods_update_division" ON public.periods
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()))
  WITH CHECK ((team_id = get_my_team_id()) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- ----- profiles policies -----
CREATE POLICY "profiles_insert_own" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "profiles_select_own" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "profiles_team_admin_update" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((team_id = get_my_team_id()) AND is_team_admin())
  WITH CHECK ((team_id = get_my_team_id()) AND is_team_admin());

CREATE POLICY "profiles_team_members_read" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (team_id = get_my_team_id());

CREATE POLICY "profiles_update_own" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = (auth.uid())::text)
  WITH CHECK (user_id = (auth.uid())::text);


-- ----- sku_rows policies -----
CREATE POLICY "sku_rows_delete_division" ON public.sku_rows
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()));

CREATE POLICY "sku_rows_insert_division" ON public.sku_rows
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "sku_rows_select_division" ON public.sku_rows
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR (user_id = (auth.uid())::text)
    OR (division_id = get_my_division_id())
    OR ((division_id IS NULL) AND (period_id IN (
      SELECT periods.id FROM periods
      WHERE is_team_admin() OR (periods.user_id = auth.uid()) OR (periods.division_id = get_my_division_id())
    )))
  );

CREATE POLICY "sku_rows_update_division" ON public.sku_rows
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()))
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- ----- team_invitations policies -----
CREATE POLICY "admin_can_manage_invitations" ON public.team_invitations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.role = 'admin'));

CREATE POLICY "anon_can_read_by_token" ON public.team_invitations
  AS PERMISSIVE FOR SELECT TO anon
  USING ((expires_at > now()) AND (accepted_at IS NULL));


-- ----- team_members policies -----
CREATE POLICY "admin_can_delete_members" ON public.team_members
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((team_id = get_my_team_id()) AND is_team_admin());

CREATE POLICY "admin_can_insert_members" ON public.team_members
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((team_id = get_my_team_id()) AND is_team_admin());

CREATE POLICY "admin_can_update_members" ON public.team_members
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((team_id = get_my_team_id()) AND is_team_admin())
  WITH CHECK ((team_id = get_my_team_id()) AND is_team_admin());

CREATE POLICY "members_can_read_own_team" ON public.team_members
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (team_id = get_my_team_id());


-- ----- teams policies -----
CREATE POLICY "team_admin_can_update" ON public.teams
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.role = 'admin'));

CREATE POLICY "team_members_can_read" ON public.teams
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid()));


-- ----- trade_investment policies -----
CREATE POLICY "trade_investment_delete_division" ON public.trade_investment
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()));

CREATE POLICY "trade_investment_insert_division" ON public.trade_investment
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));

CREATE POLICY "trade_investment_select_division" ON public.trade_investment
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR (user_id = auth.uid())
    OR (division_id = get_my_division_id())
    OR ((division_id IS NULL) AND (period_id IN (
      SELECT periods.id FROM periods
      WHERE is_team_admin() OR (periods.user_id = auth.uid()) OR (periods.division_id = get_my_division_id())
    )))
  );

CREATE POLICY "trade_investment_update_division" ON public.trade_investment
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_team_admin() OR (division_id = get_my_division_id()))
  WITH CHECK ((period_id IN (SELECT periods.id FROM periods WHERE periods.team_id = get_my_team_id())) AND (is_team_admin() OR (division_id = get_my_division_id())));


-- =============================================================================
-- SECTION 6: Triggers
-- =============================================================================

-- profiles: maintain updated_at on UPDATE
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- team_members: prevent removal/demotion of last admin
CREATE TRIGGER enforce_last_admin
  BEFORE DELETE OR UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_admin_removal();


-- =============================================================================
-- END OF BASELINE SNAPSHOT
-- =============================================================================
-- Captured tables:    15
-- Captured functions: 6
-- Captured indexes:   26
-- Captured policies:  44
-- Captured triggers:  2  (one fires on both DELETE and UPDATE)
-- =============================================================================
