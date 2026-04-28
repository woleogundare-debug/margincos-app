-- Stopgap data-integrity guard on periods.vertical
-- Prevents non-superadmin users from creating periods where vertical
-- differs from their teams.sector.
--
-- Behaviour:
--   - superadmin (profiles.is_superadmin = true): no constraint
--   - non-superadmin: NEW.vertical must equal teams.sector for the period's team
--   - service-role calls (auth.uid() = NULL): no constraint
--
-- Note on user_id type: profiles.user_id is text per the schema, while
-- auth.uid() returns uuid - cast to text for the join.

CREATE OR REPLACE FUNCTION public.enforce_period_sector_inheritance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_uid     uuid;
  caller_admin   boolean;
  team_sector    text;
BEGIN
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.is_superadmin
    INTO caller_admin
    FROM public.profiles p
   WHERE p.user_id = caller_uid::text
   LIMIT 1;

  IF caller_admin IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT t.sector
    INTO team_sector
    FROM public.teams t
   WHERE t.id = NEW.team_id
   LIMIT 1;

  IF team_sector IS NULL THEN
    RAISE EXCEPTION 'Team sector not configured. Contact administrator.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.vertical IS DISTINCT FROM team_sector THEN
    RAISE EXCEPTION 'Sector mismatch: period vertical (%) does not match team sector (%). Non-superadmin users must create periods matching their team sector.',
      NEW.vertical, team_sector
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_period_sector_inheritance() IS
  'Stopgap guard: enforces periods.vertical = teams.sector for non-superadmin users. Bypassed by superadmin and service-role calls. UI-layer fix lands separately via Cowork brief 2026-04-28.';

DROP TRIGGER IF EXISTS enforce_period_sector_inheritance_trigger ON public.periods;

CREATE TRIGGER enforce_period_sector_inheritance_trigger
  BEFORE INSERT ON public.periods
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_period_sector_inheritance();
