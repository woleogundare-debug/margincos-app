-- ============================================================================
-- PCT.FIX.REMEDIATION - Change 2: Data normalisation
-- ============================================================================
--
-- Context: The MARGINCOS.PCT.FIX commit (d4d5bca) moved the engine to read
-- pct fields as decimals per CONVENTIONS.md. However, the SkuGrid editor
-- has historically stored integer-percent values (user types 65 -> stores 65).
-- Live verification at xdlcglpqyrbknirdjgbg (production) showed all 51 FMCG
-- sku_rows in integer-percent state. The 7 production logistics_rows are
-- already decimal. Same shape confirmed in staging.
--
-- This migration normalises any pct field with value > 1 to its decimal
-- equivalent (divide by 100). The WHERE > 1 filter is a no-op for any row
-- already stored as decimal, so this is idempotent and safe to apply to
-- mixed-data tables.
--
-- Scope: 10 fields on sku_rows + 11 fields on logistics_rows = 21 fields.
--
-- Companion change: SkuGrid CellInput now normalises at write time, so new
-- saves go in as decimals. The CHECK constraint migration (C3) is applied
-- after this one to prevent re-introduction of integer-percent values.
--
-- Staging verification (2026-06-08):
--   - 51 sku_rows normalised (pt 0.28..0.78, fx 0.10..0.55 etc).
--   - 1 fixture logistics row with all 11 decimal values untouched (filter no-op).
--
-- Rollback: see comment block at bottom. Apply only immediately after the
-- forward migration, before any new writes touch these columns.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sku_rows - normalise 10 pct fields
-- ----------------------------------------------------------------------------
UPDATE sku_rows SET
  target_margin_floor_pct   = CASE WHEN target_margin_floor_pct   > 1 THEN target_margin_floor_pct   / 100 ELSE target_margin_floor_pct   END,
  proposed_price_change_pct = CASE WHEN proposed_price_change_pct > 1 THEN proposed_price_change_pct / 100 ELSE proposed_price_change_pct END,
  wtp_premium_pct           = CASE WHEN wtp_premium_pct           > 1 THEN wtp_premium_pct           / 100 ELSE wtp_premium_pct           END,
  cogs_inflation_rate       = CASE WHEN cogs_inflation_rate       > 1 THEN cogs_inflation_rate       / 100 ELSE cogs_inflation_rate       END,
  pass_through_rate         = CASE WHEN pass_through_rate         > 1 THEN pass_through_rate         / 100 ELSE pass_through_rate         END,
  fx_exposure_pct           = CASE WHEN fx_exposure_pct           > 1 THEN fx_exposure_pct           / 100 ELSE fx_exposure_pct           END,
  distributor_margin_pct    = CASE WHEN distributor_margin_pct    > 1 THEN distributor_margin_pct    / 100 ELSE distributor_margin_pct    END,
  trade_rebate_pct          = CASE WHEN trade_rebate_pct          > 1 THEN trade_rebate_pct          / 100 ELSE trade_rebate_pct          END,
  promo_depth_pct           = CASE WHEN promo_depth_pct           > 1 THEN promo_depth_pct           / 100 ELSE promo_depth_pct           END,
  promo_lift_pct            = CASE WHEN promo_lift_pct            > 1 THEN promo_lift_pct            / 100 ELSE promo_lift_pct            END
WHERE
  target_margin_floor_pct   > 1
  OR proposed_price_change_pct > 1
  OR wtp_premium_pct           > 1
  OR cogs_inflation_rate       > 1
  OR pass_through_rate         > 1
  OR fx_exposure_pct           > 1
  OR distributor_margin_pct    > 1
  OR trade_rebate_pct          > 1
  OR promo_depth_pct           > 1
  OR promo_lift_pct            > 1;

-- ----------------------------------------------------------------------------
-- 2. logistics_rows - normalise 11 pct fields
-- ----------------------------------------------------------------------------
UPDATE logistics_rows SET
  proposed_rate_change_pct = CASE WHEN proposed_rate_change_pct > 1 THEN proposed_rate_change_pct / 100 ELSE proposed_rate_change_pct END,
  min_margin_floor_pct     = CASE WHEN min_margin_floor_pct     > 1 THEN min_margin_floor_pct     / 100 ELSE min_margin_floor_pct     END,
  rate_headroom_pct        = CASE WHEN rate_headroom_pct        > 1 THEN rate_headroom_pct        / 100 ELSE rate_headroom_pct        END,
  backhaul_recovery_pct    = CASE WHEN backhaul_recovery_pct    > 1 THEN backhaul_recovery_pct    / 100 ELSE backhaul_recovery_pct    END,
  cost_inflation_pct       = CASE WHEN cost_inflation_pct       > 1 THEN cost_inflation_pct       / 100 ELSE cost_inflation_pct       END,
  pass_through_rate        = CASE WHEN pass_through_rate        > 1 THEN pass_through_rate        / 100 ELSE pass_through_rate        END,
  fx_exposure_pct          = CASE WHEN fx_exposure_pct          > 1 THEN fx_exposure_pct          / 100 ELSE fx_exposure_pct          END,
  customer_margin_pct      = CASE WHEN customer_margin_pct      > 1 THEN customer_margin_pct      / 100 ELSE customer_margin_pct      END,
  rebate_pct               = CASE WHEN rebate_pct               > 1 THEN rebate_pct               / 100 ELSE rebate_pct               END,
  discount_depth_pct       = CASE WHEN discount_depth_pct       > 1 THEN discount_depth_pct       / 100 ELSE discount_depth_pct       END,
  volume_response_pct      = CASE WHEN volume_response_pct      > 1 THEN volume_response_pct      / 100 ELSE volume_response_pct      END
WHERE
  proposed_rate_change_pct > 1
  OR min_margin_floor_pct     > 1
  OR rate_headroom_pct        > 1
  OR backhaul_recovery_pct    > 1
  OR cost_inflation_pct       > 1
  OR pass_through_rate        > 1
  OR fx_exposure_pct          > 1
  OR customer_margin_pct      > 1
  OR rebate_pct               > 1
  OR discount_depth_pct       > 1
  OR volume_response_pct      > 1;

-- ============================================================================
-- ROLLBACK (manual, apply ONLY immediately after this migration, before any
-- new writes touch these columns - otherwise correctly-stored decimal values
-- entered post-migration would be corrupted to 100x their intended values).
-- ============================================================================
-- BEGIN;
-- UPDATE sku_rows SET
--   target_margin_floor_pct   = CASE WHEN target_margin_floor_pct   <= 1 AND target_margin_floor_pct   IS NOT NULL THEN target_margin_floor_pct   * 100 ELSE target_margin_floor_pct   END,
--   proposed_price_change_pct = CASE WHEN proposed_price_change_pct <= 1 AND proposed_price_change_pct IS NOT NULL THEN proposed_price_change_pct * 100 ELSE proposed_price_change_pct END,
--   wtp_premium_pct           = CASE WHEN wtp_premium_pct           <= 1 AND wtp_premium_pct           IS NOT NULL THEN wtp_premium_pct           * 100 ELSE wtp_premium_pct           END,
--   cogs_inflation_rate       = CASE WHEN cogs_inflation_rate       <= 1 AND cogs_inflation_rate       IS NOT NULL THEN cogs_inflation_rate       * 100 ELSE cogs_inflation_rate       END,
--   pass_through_rate         = CASE WHEN pass_through_rate         <= 1 AND pass_through_rate         IS NOT NULL THEN pass_through_rate         * 100 ELSE pass_through_rate         END,
--   fx_exposure_pct           = CASE WHEN fx_exposure_pct           <= 1 AND fx_exposure_pct           IS NOT NULL THEN fx_exposure_pct           * 100 ELSE fx_exposure_pct           END,
--   distributor_margin_pct    = CASE WHEN distributor_margin_pct    <= 1 AND distributor_margin_pct    IS NOT NULL THEN distributor_margin_pct    * 100 ELSE distributor_margin_pct    END,
--   trade_rebate_pct          = CASE WHEN trade_rebate_pct          <= 1 AND trade_rebate_pct          IS NOT NULL THEN trade_rebate_pct          * 100 ELSE trade_rebate_pct          END,
--   promo_depth_pct           = CASE WHEN promo_depth_pct           <= 1 AND promo_depth_pct           IS NOT NULL THEN promo_depth_pct           * 100 ELSE promo_depth_pct           END,
--   promo_lift_pct            = CASE WHEN promo_lift_pct            <= 1 AND promo_lift_pct            IS NOT NULL THEN promo_lift_pct            * 100 ELSE promo_lift_pct            END;
-- UPDATE logistics_rows SET
--   proposed_rate_change_pct = CASE WHEN proposed_rate_change_pct <= 1 AND proposed_rate_change_pct IS NOT NULL THEN proposed_rate_change_pct * 100 ELSE proposed_rate_change_pct END,
--   min_margin_floor_pct     = CASE WHEN min_margin_floor_pct     <= 1 AND min_margin_floor_pct     IS NOT NULL THEN min_margin_floor_pct     * 100 ELSE min_margin_floor_pct     END,
--   rate_headroom_pct        = CASE WHEN rate_headroom_pct        <= 1 AND rate_headroom_pct        IS NOT NULL THEN rate_headroom_pct        * 100 ELSE rate_headroom_pct        END,
--   backhaul_recovery_pct    = CASE WHEN backhaul_recovery_pct    <= 1 AND backhaul_recovery_pct    IS NOT NULL THEN backhaul_recovery_pct    * 100 ELSE backhaul_recovery_pct    END,
--   cost_inflation_pct       = CASE WHEN cost_inflation_pct       <= 1 AND cost_inflation_pct       IS NOT NULL THEN cost_inflation_pct       * 100 ELSE cost_inflation_pct       END,
--   pass_through_rate        = CASE WHEN pass_through_rate        <= 1 AND pass_through_rate        IS NOT NULL THEN pass_through_rate        * 100 ELSE pass_through_rate        END,
--   fx_exposure_pct          = CASE WHEN fx_exposure_pct          <= 1 AND fx_exposure_pct          IS NOT NULL THEN fx_exposure_pct          * 100 ELSE fx_exposure_pct          END,
--   customer_margin_pct      = CASE WHEN customer_margin_pct      <= 1 AND customer_margin_pct      IS NOT NULL THEN customer_margin_pct      * 100 ELSE customer_margin_pct      END,
--   rebate_pct               = CASE WHEN rebate_pct               <= 1 AND rebate_pct               IS NOT NULL THEN rebate_pct               * 100 ELSE rebate_pct               END,
--   discount_depth_pct       = CASE WHEN discount_depth_pct       <= 1 AND discount_depth_pct       IS NOT NULL THEN discount_depth_pct       * 100 ELSE discount_depth_pct       END,
--   volume_response_pct      = CASE WHEN volume_response_pct      <= 1 AND volume_response_pct      IS NOT NULL THEN volume_response_pct      * 100 ELSE volume_response_pct      END;
-- COMMIT;
