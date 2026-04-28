-- Migration: enforce_tier_limits_via_db_trigger
-- Date: 2026-04-28
-- Purpose: Backstop the React UI tier caps with a DB-level trigger.
--          Prevents direct API or SQL bypass of tier limits.
--
-- Bypassed by:
--   1. Service-role calls (auth.uid() IS NULL) - automation passes
--   2. Superadmin users (profiles.is_superadmin = true) - testing/admin flexibility
--
-- Tier limits are hardcoded in the function (mirrors lib/constants.js)
-- so the trigger is independent of app config. If TIER_LIMITS changes
-- in code, the trigger must be re-applied with the new values.
--
-- See cowork brief 2026-04-28 cross-tier audit for the full architectural
-- rationale.

CREATE OR REPLACE FUNCTION public.enforce_tier_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  caller_uid     uuid;
  caller_admin   boolean;
  team_id_value  uuid;
  team_tier      text;
  current_count  int;
  limit_value    int;
  limit_field    text := TG_ARGV[0];
  team_id_via    text := TG_ARGV[1];
  count_filter   text := COALESCE(TG_ARGV[2], '');
  count_sql      text;
BEGIN
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF team_id_via = 'direct' THEN
    team_id_value := NEW.team_id;
  ELSIF team_id_via = 'via_division' THEN
    SELECT d.team_id INTO team_id_value
      FROM public.divisions d
      WHERE d.id = NEW.division_id
      LIMIT 1;
  ELSE
    RAISE EXCEPTION 'enforce_tier_limit: invalid team_id_via parameter: %', team_id_via
      USING ERRCODE = '42P02';
  END IF;

  IF team_id_value IS NULL THEN
    RAISE EXCEPTION 'enforce_tier_limit: could not derive team_id for tier-cap check'
      USING ERRCODE = '23502';
  END IF;

  SELECT p.is_superadmin INTO caller_admin
    FROM public.profiles p
    WHERE p.user_id = caller_uid::text
    LIMIT 1;
  IF caller_admin IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT t.tier INTO team_tier
    FROM public.teams t
    WHERE t.id = team_id_value
    LIMIT 1;

  IF team_tier IS NULL THEN
    RAISE EXCEPTION 'Team tier not configured. Contact administrator.'
      USING ERRCODE = '23514';
  END IF;

  limit_value := CASE
    WHEN team_tier = 'essentials'   AND limit_field = 'maxDivisions' THEN 1
    WHEN team_tier = 'essentials'   AND limit_field = 'maxPeriods'   THEN 1
    WHEN team_tier = 'essentials'   AND limit_field = 'maxSkus'      THEN 50
    WHEN team_tier = 'essentials'   AND limit_field = 'maxLanes'     THEN 50
    WHEN team_tier = 'professional' AND limit_field = 'maxDivisions' THEN 3
    WHEN team_tier = 'professional' AND limit_field = 'maxSkus'      THEN 200
    WHEN team_tier = 'professional' AND limit_field = 'maxLanes'     THEN 200
    ELSE NULL
  END;

  IF limit_value IS NULL THEN
    RETURN NEW;
  END IF;

  IF team_id_via = 'direct' THEN
    count_sql := format(
      'SELECT COUNT(*) FROM public.%I WHERE team_id = $1',
      TG_TABLE_NAME
    );
  ELSE
    count_sql := format(
      'SELECT COUNT(*) FROM public.%I WHERE division_id IN '
      '(SELECT id FROM public.divisions WHERE team_id = $1)',
      TG_TABLE_NAME
    );
  END IF;

  IF count_filter <> '' THEN
    count_sql := count_sql || ' AND ' || count_filter;
  END IF;

  EXECUTE count_sql USING team_id_value INTO current_count;

  IF current_count >= limit_value THEN
    RAISE EXCEPTION 'Tier cap reached: % plan allows up to % %. Upgrade to add more.',
      team_tier, limit_value, limit_field
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$func$;

COMMENT ON FUNCTION public.enforce_tier_limit() IS
  'Generic BEFORE INSERT trigger that enforces TIER_LIMITS-style numeric caps. '
  'Accepts three TG_ARGV: limit_field (e.g. maxDivisions), team_id_via '
  '(direct|via_division), count_filter (raw SQL fragment). Bypassed by '
  'service-role calls and superadmin users. Hardcodes the limits in SQL '
  'mirroring lib/constants.js TIER_LIMITS.';

DROP TRIGGER IF EXISTS enforce_division_tier_limit_trigger ON public.divisions;
CREATE TRIGGER enforce_division_tier_limit_trigger
  BEFORE INSERT ON public.divisions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tier_limit('maxDivisions', 'direct', 'is_archived = false');

DROP TRIGGER IF EXISTS enforce_period_tier_limit_trigger ON public.periods;
CREATE TRIGGER enforce_period_tier_limit_trigger
  BEFORE INSERT ON public.periods
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tier_limit('maxPeriods', 'direct', '');

DROP TRIGGER IF EXISTS enforce_sku_row_tier_limit_trigger ON public.sku_rows;
CREATE TRIGGER enforce_sku_row_tier_limit_trigger
  BEFORE INSERT ON public.sku_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tier_limit(
    'maxSkus',
    'via_division',
    $arg$lower(coalesce(active, '')) IN ('y','true','active')$arg$
  );

DROP TRIGGER IF EXISTS enforce_logistics_row_tier_limit_trigger ON public.logistics_rows;
CREATE TRIGGER enforce_logistics_row_tier_limit_trigger
  BEFORE INSERT ON public.logistics_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tier_limit(
    'maxLanes',
    'via_division',
    $arg$lower(coalesce(active, '')) IN ('y','true','active')$arg$
  );
