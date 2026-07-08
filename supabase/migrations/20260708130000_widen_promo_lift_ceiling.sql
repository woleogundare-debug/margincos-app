-- ============================================================================
-- DATA.CONTRACT F-13 - widen promo-lift / volume-response ceiling to +500%
-- ============================================================================
-- Deep FMCG price promotions (30-50% depth) on price-elastic categories produce
-- 150-400% incremental volume lift; the +200% (2.0) cap clipped realistic data.
-- Only promo_lift_pct (sku_rows) and volume_response_pct (logistics_rows) measure
-- an unbounded incremental-volume response and can legitimately exceed 2.0. The
-- other 19 chk_%_decimal_range constraints stay at BETWEEN 0 AND 2 (recovery,
-- pass-through, margins, floors, fx, inflation, price/rate change, wtp, rebate,
-- backhaul, headroom) - all inherently bounded at/near 100%.
--
-- Engine safety: p4-trade.js / p4-logistics.js consume lift only as
-- promoVol = vol * (1 + lift), which is linear and monotonic; no formula divides
-- by (1 + lift) and the breakeven-lift calc does not reference the field. A lift
-- of 5.0 is structurally safe.
--
-- Lower bound 0 preserved on both fields.
-- ============================================================================

ALTER TABLE sku_rows DROP CONSTRAINT chk_sku_rows_promo_lift_pct_decimal_range;
ALTER TABLE sku_rows ADD CONSTRAINT chk_sku_rows_promo_lift_pct_decimal_range
  CHECK (promo_lift_pct IS NULL OR promo_lift_pct BETWEEN 0 AND 5);

ALTER TABLE logistics_rows DROP CONSTRAINT chk_logistics_rows_volume_response_pct_decimal_range;
ALTER TABLE logistics_rows ADD CONSTRAINT chk_logistics_rows_volume_response_pct_decimal_range
  CHECK (volume_response_pct IS NULL OR volume_response_pct BETWEEN 0 AND 5);

-- ============================================================================
-- ROLLBACK (down migration) - restore the +200% ceiling
-- ----------------------------------------------------------------------------
-- ALTER TABLE sku_rows DROP CONSTRAINT chk_sku_rows_promo_lift_pct_decimal_range;
-- ALTER TABLE sku_rows ADD CONSTRAINT chk_sku_rows_promo_lift_pct_decimal_range
--   CHECK (promo_lift_pct IS NULL OR promo_lift_pct BETWEEN 0 AND 2);
-- ALTER TABLE logistics_rows DROP CONSTRAINT chk_logistics_rows_volume_response_pct_decimal_range;
-- ALTER TABLE logistics_rows ADD CONSTRAINT chk_logistics_rows_volume_response_pct_decimal_range
--   CHECK (volume_response_pct IS NULL OR volume_response_pct BETWEEN 0 AND 2);
-- ============================================================================
