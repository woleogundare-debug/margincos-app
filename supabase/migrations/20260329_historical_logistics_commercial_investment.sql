-- Create logistics_commercial_investment table
CREATE TABLE logistics_commercial_investment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  contract_type text NOT NULL,
  volume_rebates numeric DEFAULT 0,
  fuel_surcharge_waivers numeric DEFAULT 0,
  rate_holddowns numeric DEFAULT 0,
  deadhead_absorption numeric DEFAULT 0,
  credit_extension_cost numeric DEFAULT 0,
  fleet_dedication_premium numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE logistics_commercial_investment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logistics investment data"
  ON logistics_commercial_investment FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own logistics investment data"
  ON logistics_commercial_investment FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own logistics investment data"
  ON logistics_commercial_investment FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own logistics investment data"
  ON logistics_commercial_investment FOR DELETE
  USING (user_id = auth.uid()::text);

-- Indexes
CREATE INDEX idx_logistics_ci_period ON logistics_commercial_investment(period_id);
CREATE INDEX idx_logistics_ci_user ON logistics_commercial_investment(user_id);
