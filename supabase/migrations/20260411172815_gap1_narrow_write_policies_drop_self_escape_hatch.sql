-- Recovered from production tracker on 2026-04-15.
-- Originally applied via MCP apply_migration without a repo file.
-- Version: 20260411172815
-- Name: gap1_narrow_write_policies_drop_self_escape_hatch
-- ============================================================
-- GAP 1 NARROWING: remove user_id = auth.uid() self-write escape hatch
-- from INSERT/UPDATE/DELETE policies on 5 division-scoped tables.
-- SELECT policies unchanged. action_items unchanged (already clean).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- periods
-- ------------------------------------------------------------
DROP POLICY IF EXISTS periods_insert_division ON periods;
DROP POLICY IF EXISTS periods_update_division ON periods;
DROP POLICY IF EXISTS periods_delete_division ON periods;

CREATE POLICY periods_insert_division ON periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY periods_update_division ON periods
  FOR UPDATE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    team_id = get_my_team_id()
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY periods_delete_division ON periods
  FOR DELETE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  );

-- ------------------------------------------------------------
-- sku_rows
-- ------------------------------------------------------------
DROP POLICY IF EXISTS sku_rows_insert_division ON sku_rows;
DROP POLICY IF EXISTS sku_rows_update_division ON sku_rows;
DROP POLICY IF EXISTS sku_rows_delete_division ON sku_rows;

CREATE POLICY sku_rows_insert_division ON sku_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY sku_rows_update_division ON sku_rows
  FOR UPDATE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY sku_rows_delete_division ON sku_rows
  FOR DELETE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  );

-- ------------------------------------------------------------
-- logistics_rows
-- ------------------------------------------------------------
DROP POLICY IF EXISTS logistics_rows_insert_division ON logistics_rows;
DROP POLICY IF EXISTS logistics_rows_update_division ON logistics_rows;
DROP POLICY IF EXISTS logistics_rows_delete_division ON logistics_rows;

CREATE POLICY logistics_rows_insert_division ON logistics_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY logistics_rows_update_division ON logistics_rows
  FOR UPDATE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY logistics_rows_delete_division ON logistics_rows
  FOR DELETE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  );

-- ------------------------------------------------------------
-- trade_investment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS trade_investment_insert_division ON trade_investment;
DROP POLICY IF EXISTS trade_investment_update_division ON trade_investment;
DROP POLICY IF EXISTS trade_investment_delete_division ON trade_investment;

CREATE POLICY trade_investment_insert_division ON trade_investment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY trade_investment_update_division ON trade_investment
  FOR UPDATE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY trade_investment_delete_division ON trade_investment
  FOR DELETE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  );

-- ------------------------------------------------------------
-- logistics_commercial_investment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS lci_insert_division ON logistics_commercial_investment;
DROP POLICY IF EXISTS lci_update_division ON logistics_commercial_investment;
DROP POLICY IF EXISTS lci_delete_division ON logistics_commercial_investment;

CREATE POLICY lci_insert_division ON logistics_commercial_investment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY lci_update_division ON logistics_commercial_investment
  FOR UPDATE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  )
  WITH CHECK (
    period_id IN (
      SELECT id FROM periods
      WHERE team_id = get_my_team_id()
    )
    AND (
      is_team_admin()
      OR division_id = get_my_division_id()
    )
  );

CREATE POLICY lci_delete_division ON logistics_commercial_investment
  FOR DELETE
  TO authenticated
  USING (
    is_team_admin()
    OR division_id = get_my_division_id()
  );

-- ------------------------------------------------------------
-- Post-flight: policy count must still equal 24.
-- ------------------------------------------------------------
DO $$
DECLARE
  c integer;
BEGIN
  SELECT count(*) INTO c
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('periods','sku_rows','logistics_rows','trade_investment',
                      'logistics_commercial_investment','action_items')
    AND policyname LIKE '%_division';
  IF c <> 24 THEN
    RAISE EXCEPTION 'Narrowing post-flight FAIL: expected 24 policies, found %', c;
  END IF;
  RAISE NOTICE 'Narrowing applied cleanly. Policy count still 24.';
END $$;

COMMIT;
