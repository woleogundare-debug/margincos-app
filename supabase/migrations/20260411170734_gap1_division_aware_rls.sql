-- Recovered from production tracker on 2026-04-15.
-- Originally applied via MCP apply_migration without a repo file.
-- Version: 20260411170734
-- Name: gap1_division_aware_rls
-- ============================================================
-- GAP 1: Division-aware RLS enforcement (with Flag 4 tightening)
-- ============================================================

-- PHASE 0: Pre-flight assertions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                 WHERE n.nspname = 'public' AND p.proname = 'get_my_team_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: get_my_team_id() missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                 WHERE n.nspname = 'public' AND p.proname = 'is_team_admin') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: is_team_admin() missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: profiles.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'periods' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: periods.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'sku_rows' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: sku_rows.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'logistics_rows' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: logistics_rows.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'trade_investment' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: trade_investment.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'logistics_commercial_investment' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: logistics_commercial_investment.division_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'action_items' AND column_name = 'division_id') THEN
    RAISE EXCEPTION 'Pre-flight FAIL: action_items.division_id missing';
  END IF;
  RAISE NOTICE 'Gap 1 pre-flight checks OK';
END $$;

-- PHASE 1: Helper function
CREATE OR REPLACE FUNCTION public.get_my_division_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $fn$
  SELECT division_id FROM profiles WHERE user_id = (auth.uid())::text LIMIT 1;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_my_division_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_division_id() TO authenticated;

-- PHASE 2: periods
DROP POLICY IF EXISTS team_data_access ON periods;

CREATE POLICY periods_select_division ON periods
  FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
  );

CREATE POLICY periods_insert_division ON periods
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR user_id = auth.uid()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY periods_update_division ON periods
  FOR UPDATE TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR user_id = auth.uid()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY periods_delete_division ON periods
  FOR DELETE TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
  );

-- PHASE 3: sku_rows (with Flag 4 tightening)
DROP POLICY IF EXISTS team_data_access ON sku_rows;

CREATE POLICY sku_rows_select_division ON sku_rows
  FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
    OR (
      division_id IS NULL
      AND period_id IN (
        SELECT id FROM periods
        WHERE is_team_admin()
           OR user_id = auth.uid()
           OR division_id = get_my_division_id()
      )
    )
  );

CREATE POLICY sku_rows_insert_division ON sku_rows
  FOR INSERT TO authenticated
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY sku_rows_update_division ON sku_rows
  FOR UPDATE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY sku_rows_delete_division ON sku_rows
  FOR DELETE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  );

-- PHASE 4: logistics_rows (with Flag 4 tightening)
DROP POLICY IF EXISTS team_data_access ON logistics_rows;

CREATE POLICY logistics_rows_select_division ON logistics_rows
  FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
    OR (
      division_id IS NULL
      AND period_id IN (
        SELECT id FROM periods
        WHERE is_team_admin()
           OR user_id = auth.uid()
           OR division_id = get_my_division_id()
      )
    )
  );

CREATE POLICY logistics_rows_insert_division ON logistics_rows
  FOR INSERT TO authenticated
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY logistics_rows_update_division ON logistics_rows
  FOR UPDATE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY logistics_rows_delete_division ON logistics_rows
  FOR DELETE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  );

-- PHASE 5: trade_investment (user_id UUID, with Flag 4 tightening)
DROP POLICY IF EXISTS team_data_access ON trade_investment;

CREATE POLICY trade_investment_select_division ON trade_investment
  FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
    OR (
      division_id IS NULL
      AND period_id IN (
        SELECT id FROM periods
        WHERE is_team_admin()
           OR user_id = auth.uid()
           OR division_id = get_my_division_id()
      )
    )
  );

CREATE POLICY trade_investment_insert_division ON trade_investment
  FOR INSERT TO authenticated
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = auth.uid()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY trade_investment_update_division ON trade_investment
  FOR UPDATE TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = auth.uid()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY trade_investment_delete_division ON trade_investment
  FOR DELETE TO authenticated
  USING (
    is_team_admin()
    OR user_id = auth.uid()
    OR division_id = get_my_division_id()
  );

-- PHASE 6: logistics_commercial_investment (user_id TEXT, with Flag 4 tightening)
DROP POLICY IF EXISTS team_data_access ON logistics_commercial_investment;

CREATE POLICY lci_select_division ON logistics_commercial_investment
  FOR SELECT TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
    OR (
      division_id IS NULL
      AND period_id IN (
        SELECT id FROM periods
        WHERE is_team_admin()
           OR user_id = auth.uid()
           OR division_id = get_my_division_id()
      )
    )
  );

CREATE POLICY lci_insert_division ON logistics_commercial_investment
  FOR INSERT TO authenticated
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY lci_update_division ON logistics_commercial_investment
  FOR UPDATE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (SELECT id FROM periods WHERE team_id = get_my_team_id())
    AND (
      is_team_admin()
      OR user_id = (auth.uid())::text
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY lci_delete_division ON logistics_commercial_investment
  FOR DELETE TO authenticated
  USING (
    is_team_admin()
    OR user_id = (auth.uid())::text
    OR division_id = get_my_division_id()
  );

-- PHASE 7: action_items (drops 4 legacy policies mixing public/authenticated roles)
DROP POLICY IF EXISTS action_items_select ON action_items;
DROP POLICY IF EXISTS action_items_insert ON action_items;
DROP POLICY IF EXISTS action_items_update ON action_items;
DROP POLICY IF EXISTS action_items_delete ON action_items;

CREATE POLICY action_items_select_division ON action_items
  FOR SELECT TO authenticated
  USING (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY action_items_insert_division ON action_items
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY action_items_update_division ON action_items
  FOR UPDATE TO authenticated
  USING (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  )
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY action_items_delete_division ON action_items
  FOR DELETE TO authenticated
  USING (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

-- PHASE 8: Post-flight assertions
DO $$
DECLARE
  new_policy_count integer;
  old_policy_count integer;
  helper_exists    boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_my_division_id'
  ) INTO helper_exists;
  IF NOT helper_exists THEN
    RAISE EXCEPTION 'Post-flight FAIL: get_my_division_id() helper missing';
  END IF;

  SELECT count(*) INTO new_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('periods','sku_rows','logistics_rows','trade_investment',
                      'logistics_commercial_investment','action_items')
    AND policyname LIKE '%_division';
  IF new_policy_count < 24 THEN
    RAISE EXCEPTION 'Post-flight FAIL: expected 24 new division-aware policies, found %', new_policy_count;
  END IF;

  SELECT count(*) INTO old_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('periods','sku_rows','logistics_rows','trade_investment','logistics_commercial_investment')
    AND policyname = 'team_data_access';
  IF old_policy_count > 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: % legacy team_data_access policies still present', old_policy_count;
  END IF;

  SELECT count(*) INTO old_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'action_items'
    AND policyname IN ('action_items_select','action_items_insert','action_items_update','action_items_delete');
  IF old_policy_count > 0 THEN
    RAISE EXCEPTION 'Post-flight FAIL: % legacy action_items policies still present', old_policy_count;
  END IF;

  RAISE NOTICE 'Gap 1 post-flight checks PASSED';
END $$;
