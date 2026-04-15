-- Create logistics_rows table
CREATE TABLE logistics_rows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,

  -- IDENTITY
  lane_id text NOT NULL,
  lane_name text NOT NULL,
  route_region text,
  cargo_type text,
  fleet_division text,
  active text DEFAULT 'Y',

  -- LANE ECONOMICS · P1
  contracted_rate_ngn numeric,
  fully_loaded_cost_ngn numeric,
  distance_km numeric,
  market_rate_ngn numeric,
  rate_sensitivity numeric,
  proposed_rate_change_pct numeric,
  min_margin_floor_pct numeric,
  rate_headroom_pct numeric,

  -- BACKHAUL · P1 extension
  return_lane_id text,
  backhaul_rate_ngn numeric,
  backhaul_cost_ngn numeric,
  backhaul_recovery_pct numeric,

  -- COST STRUCTURE · P2
  fuel_cost_per_km numeric,
  driver_cost_per_trip numeric,
  maintenance_cost_per_trip numeric,
  toll_levy_per_trip numeric,
  cost_inflation_pct numeric,
  pass_through_rate numeric,
  prior_period_cost_ngn numeric,
  fx_exposure_pct numeric,

  -- FLEET · P3
  truck_id text,
  truck_type text,
  contract_type text,
  customer_name text,
  customer_margin_pct numeric,
  rebate_pct numeric,
  payment_terms_days numeric,
  fuel_surcharge_clause text,

  -- VOLUME · P4
  monthly_trips numeric,
  discount_depth_pct numeric,
  volume_response_pct numeric,

  -- METADATA
  operating_region text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies (matching sku_rows pattern)
ALTER TABLE logistics_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logistics data"
  ON logistics_rows FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own logistics data"
  ON logistics_rows FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own logistics data"
  ON logistics_rows FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own logistics data"
  ON logistics_rows FOR DELETE
  USING (user_id = auth.uid()::text);

-- Index for fast period-based queries
CREATE INDEX idx_logistics_rows_period ON logistics_rows(period_id);
CREATE INDEX idx_logistics_rows_user ON logistics_rows(user_id);

-- Add unique constraint to prevent duplicate lane_ids per period
ALTER TABLE logistics_rows
  ADD CONSTRAINT unique_lane_per_period UNIQUE (period_id, lane_id);
