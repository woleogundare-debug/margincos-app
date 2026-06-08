-- ============================================================================
-- PCT.FIX.REMEDIATION - Change 3: CHECK constraints
-- ============================================================================
--
-- Adds BETWEEN 0 AND 2 range constraints on all 21 pct columns to prevent
-- re-introduction of integer-percent values via any write path. The upper
-- bound of 2 permits legitimate over-100% values (e.g. cost-plus pricing
-- at 1.5x, full pass-through with markup at 1.2x) while rejecting integer
-- inputs (28, 65, 100 etc all fail the BETWEEN 0 AND 2 check).
--
-- Naming convention: chk_<table>_<field>_decimal_range
--
-- Apply order: must run after the C2 data normalisation migration so the
-- existing FMCG integer-percent values do not violate the constraint at
-- creation time. NULL values are always allowed.
--
-- Staging verification (2026-06-08):
--   - 21 constraints created.
--   - UPDATE pass_through_rate = 65 rejected with check_violation.
--   - UPDATE pass_through_rate = 1.20 accepted (cost-plus headroom proven).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sku_rows - 10 CHECK constraints
-- ----------------------------------------------------------------------------
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_target_margin_floor_pct_decimal_range
    CHECK (target_margin_floor_pct IS NULL OR target_margin_floor_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_proposed_price_change_pct_decimal_range
    CHECK (proposed_price_change_pct IS NULL OR proposed_price_change_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_wtp_premium_pct_decimal_range
    CHECK (wtp_premium_pct IS NULL OR wtp_premium_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_cogs_inflation_rate_decimal_range
    CHECK (cogs_inflation_rate IS NULL OR cogs_inflation_rate BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_pass_through_rate_decimal_range
    CHECK (pass_through_rate IS NULL OR pass_through_rate BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_fx_exposure_pct_decimal_range
    CHECK (fx_exposure_pct IS NULL OR fx_exposure_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_distributor_margin_pct_decimal_range
    CHECK (distributor_margin_pct IS NULL OR distributor_margin_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_trade_rebate_pct_decimal_range
    CHECK (trade_rebate_pct IS NULL OR trade_rebate_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_promo_depth_pct_decimal_range
    CHECK (promo_depth_pct IS NULL OR promo_depth_pct BETWEEN 0 AND 2);
ALTER TABLE sku_rows
  ADD CONSTRAINT chk_sku_rows_promo_lift_pct_decimal_range
    CHECK (promo_lift_pct IS NULL OR promo_lift_pct BETWEEN 0 AND 2);

-- ----------------------------------------------------------------------------
-- 2. logistics_rows - 11 CHECK constraints
-- ----------------------------------------------------------------------------
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_proposed_rate_change_pct_decimal_range
    CHECK (proposed_rate_change_pct IS NULL OR proposed_rate_change_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_min_margin_floor_pct_decimal_range
    CHECK (min_margin_floor_pct IS NULL OR min_margin_floor_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_rate_headroom_pct_decimal_range
    CHECK (rate_headroom_pct IS NULL OR rate_headroom_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_backhaul_recovery_pct_decimal_range
    CHECK (backhaul_recovery_pct IS NULL OR backhaul_recovery_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_cost_inflation_pct_decimal_range
    CHECK (cost_inflation_pct IS NULL OR cost_inflation_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_pass_through_rate_decimal_range
    CHECK (pass_through_rate IS NULL OR pass_through_rate BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_fx_exposure_pct_decimal_range
    CHECK (fx_exposure_pct IS NULL OR fx_exposure_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_customer_margin_pct_decimal_range
    CHECK (customer_margin_pct IS NULL OR customer_margin_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_rebate_pct_decimal_range
    CHECK (rebate_pct IS NULL OR rebate_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_discount_depth_pct_decimal_range
    CHECK (discount_depth_pct IS NULL OR discount_depth_pct BETWEEN 0 AND 2);
ALTER TABLE logistics_rows
  ADD CONSTRAINT chk_logistics_rows_volume_response_pct_decimal_range
    CHECK (volume_response_pct IS NULL OR volume_response_pct BETWEEN 0 AND 2);
