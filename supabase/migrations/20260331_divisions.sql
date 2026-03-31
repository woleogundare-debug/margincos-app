-- ============================================================
-- PHASE 1: Division Hierarchy Foundation
-- ============================================================

-- 1. Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT,                    -- optional: lock a division to a sector
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each team can have only one division with a given name
  UNIQUE(team_id, name)
);

-- 2. Add division_id to periods table
ALTER TABLE periods
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- 3. Add division_id to profiles (user-division assignment)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

-- 4. Add division_id to data tables
ALTER TABLE sku_rows
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

ALTER TABLE logistics_rows
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

ALTER TABLE trade_investment
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

ALTER TABLE logistics_commercial_investment
  ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

-- 5. Create default divisions for ALL existing teams
-- Every existing team gets a "Primary" division so nothing breaks
INSERT INTO divisions (team_id, name, is_default)
SELECT id, name, true
FROM teams
WHERE NOT EXISTS (
  SELECT 1 FROM divisions WHERE divisions.team_id = teams.id
);

-- 6. Backfill division_id on existing periods
-- Link existing periods to their team's default division
-- Find the team for each period via the user's profile
UPDATE periods p
SET
  division_id = d.id,
  team_id = d.team_id
FROM profiles pr
JOIN divisions d ON d.team_id = pr.team_id AND d.is_default = true
WHERE p.user_id = pr.user_id
  AND p.division_id IS NULL;

-- 7. Backfill division_id on existing data rows
UPDATE sku_rows sr
SET division_id = p.division_id
FROM periods p
WHERE sr.period_id = p.id
  AND sr.division_id IS NULL
  AND p.division_id IS NOT NULL;

UPDATE logistics_rows lr
SET division_id = p.division_id
FROM periods p
WHERE lr.period_id = p.id
  AND lr.division_id IS NULL
  AND p.division_id IS NOT NULL;

UPDATE trade_investment ti
SET division_id = p.division_id
FROM periods p
WHERE ti.period_id = p.id
  AND ti.division_id IS NULL
  AND p.division_id IS NOT NULL;

UPDATE logistics_commercial_investment lci
SET division_id = p.division_id
FROM periods p
WHERE lci.period_id = p.id
  AND lci.division_id IS NULL
  AND p.division_id IS NOT NULL;

UPDATE action_items ai
SET division_id = p.division_id
FROM periods p
WHERE ai.period_id = p.id
  AND ai.division_id IS NULL
  AND p.division_id IS NOT NULL;

-- 8. RLS policies for divisions table
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Team members can read their team's divisions
CREATE POLICY "divisions_select" ON divisions
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()::text
    )
  );

-- Only team admins can insert divisions
CREATE POLICY "divisions_insert" ON divisions
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()::text AND tm.role = 'admin'
    )
  );

-- Only team admins can update divisions
CREATE POLICY "divisions_update" ON divisions
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()::text AND tm.role = 'admin'
    )
  );

-- Only team admins can delete divisions
CREATE POLICY "divisions_delete" ON divisions
  FOR DELETE USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()::text AND tm.role = 'admin'
    )
  );

-- 9. Add division limit comment
COMMENT ON TABLE divisions IS 'Company divisions. Essentials: 1, Professional: up to 3, Enterprise: unlimited. Consolidated view available for 2+ divisions (Professional and Enterprise).';

-- 10. Performance indexes
CREATE INDEX IF NOT EXISTS idx_divisions_team_id ON divisions(team_id);
CREATE INDEX IF NOT EXISTS idx_periods_division_id ON periods(division_id);
CREATE INDEX IF NOT EXISTS idx_periods_team_id ON periods(team_id);
CREATE INDEX IF NOT EXISTS idx_sku_rows_division_id ON sku_rows(division_id);
CREATE INDEX IF NOT EXISTS idx_logistics_rows_division_id ON logistics_rows(division_id);
