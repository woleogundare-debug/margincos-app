# Engine numeric conventions

Anyone touching pillar or module code under `lib/engine/` reads this file first. The conventions below are load-bearing - the wrong assumption causes 100x display errors across every dashboard surface.

## The template stores percentages as decimals

The four sector templates under `public/downloads/` carry the explicit rule on the Start Here sheet, Step 5:

> Enter ALL percentages as DECIMALS (e.g. 0.18 for 18%, 0.40 for 40%). Do NOT enter 18 or 40 - the platform expects decimals.

Validation Rules rows 19 and 20 reinforce the rule with example warnings (`18% = 0.18, not 18`, `65% = 0.65, not 65`).

This is the contract. Engine code reads template percentage values as raw decimals in the range 0..1 with no normalisation.

## Input convention

When the engine reads a field declared `type: 'pct'` in the `COLUMNS` or `LOGISTICS_COLUMNS` arrays in `components/portfolio/SkuGrid.js`, the value is already a decimal. **Do not divide by 100.** Past defects (resolved 2026-06-04) divided by 100 on input, which collapsed every percentage by 100x and produced the "1% pass-through" rendering on the Cost Absorption table.

```js
// Wrong - divides decimal by 100, yielding 0.0065 instead of 0.65
const pt = n(r.pass_through_rate) / 100;

// Correct - template decimal flows through untouched
const pt = n(r.pass_through_rate);
```

## Write boundary - decimal-native input

All pct fields stored as decimals throughout the platform. Users enter decimals (0.65 for 65%). Display layers multiply by 100 only for read-only rendering (dashboards, PDF, Excel exports). No conversion at write boundary.

Both write paths honour this: the template stores decimals, the bulk-import parser writes the file value untouched, and the SkuGrid inline editor stores the typed decimal as-is (the trailing `%` glyph is a label, not a scale). The DB CHECK constraints (`BETWEEN 0 AND 2`, and `0 AND 5` for promo lift / volume response) enforce the decimal range, so an accidental integer-percent entry (65) hard-fails at write rather than being silently mis-scaled.

## NULL means missing, not zero

A NULL in a pct field means genuinely missing data, not an empirically observed 0%. Read such fields with `nOrNull()`, not `n()`, wherever a zero would be misread as a finding. Portfolio aggregates (recovery rate, absorbed cost) exclude NULL rows rather than counting them as 100% absorbed. RAG classification skips NULL rows rather than colouring them red. The action queue suppresses NULL rows rather than listing them as high-absorption. A stored 0 is a real observation and is treated as such - only NULL/blank is "missing". Fields where zero is the correct default (margin floor absent, no promotion, no FX exposure) keep `n()`.

Currently wired for P2 pass-through and cost inflation (`p2-cost.js`, `p2-logistics.js`), which emit `dataMissing: true` rows that the dashboard renders as a "Data missing" pill, the aggregates exclude, and the action queue skips. Distributor/customer margin reads still use `n()` pending the clamping cycle.

## Elasticity is NOT a percentage

Price elasticity (`price_elasticity`, `rate_sensitivity`) is a dimensionless coefficient, typically -0.5 to -2.0. **Never normalise these.** They are not declared `type: 'pct'` in SkuGrid for exactly this reason. A blanket "remove `/100` from every percentage field" sweep must skip elasticity reads entirely.

```js
// Correct - read as raw number, default to -0.7 if blank
const el = n(r.price_elasticity) || -0.7;
```

## Output convention

The engine produces two kinds of percentage-bearing outputs. Both are valid; the right one depends on what the consumer expects.

**Decimal 0..1.** Used when the consumer multiplies by 100 at render time. Most pillar-row outputs follow this pattern - `r.pt`, `r.depth`, `r.lift`, `recoveryRate`. Display layer reads:

```js
{(r.pt * 100).toFixed(0)}%
```

**Percentage point.** Used when the consumer renders the value directly. Aggregate metrics follow this pattern - `portRecoveryPct`, `priceRealisation`, `marginPct`, `compGap`. Display layer reads:

```js
{(p2.portRecoveryPct).toFixed(1)}%
```

Both conventions are correct provided the engine and display agree per field. When adding a new field, document which convention it uses in the engine output object's JSDoc.

## Internal arithmetic

Inside an engine function, scale freely. The convention is only enforced at the input/output boundaries. The line that produced the "Fleet recovery rate of 0.7%" defect is illustrative:

```js
// p2-logistics.js with the bug
const pt = n(r.pass_through_rate) / 100;  // 0.65 / 100 = 0.0065
const absorbed = shock - (shock * pt);    // shock × 0.9935
const portRecoveryPct = 100 - avgAbsorbedPct;  // ≈ 0.65 (looks correct but isn't)
```

The portfolio aggregate emerged at 0.65 - the same magnitude as the template's 0.65 - which obscured the bug for both reviewers and clients. The narrative builder appended `%` to the number, giving "0.7%" instead of "65%".

## Floor breach pattern

When comparing a margin percentage point against a floor decimal, multiply the floor by 100 in the comparison rather than coercing the margin into a decimal. This keeps the marginPct field consistent with its consumers (which render it as a percentage point).

```js
const marginPct = (price - cogs) / price * 100;       // percentage point
const floorPct  = n(r.target_margin_floor_pct);       // decimal 0..1
const floorBreach = floorPct > 0 ? marginPct < (floorPct * 100) : null;
```

The `floorPct * 100` lives at the comparison, not at the field read. The stored `floorPct` field remains a decimal so future consumers can choose their own scaling.

## Adding a new percentage field

Checklist when introducing a new percentage-bearing column:

1. Declare it in the appropriate sector COLUMNS array with `type: 'pct'`
2. Add a Start Here Step 5 entry if the convention warrants a fresh reinforcement
3. Add a Validation Rules row if the field has a sensible threshold (e.g. > 1.0 should warn)
4. Engine input read: no `/100`, read as raw decimal
5. Document the engine output convention (decimal vs percentage point) on the output object
6. Display layer follows the documented convention
7. Excel export and PDF report follow the same convention

## Verification

After any engine input change, re-upload the Logistics template seed data with the Lagos-Abuja row (`pass_through_rate = 0.65`) and confirm:

- Cost Absorption table renders `65%` pass-through
- Cost commentary text reads "Fleet recovery rate of 65%"
- Portfolio Rate · P1 tab shows proposed rate change as `5%`
- Floor breach detection fires on any lane with margin below `min_margin_floor_pct × 100`

If any of these reads off, the convention has drifted somewhere. Trace input → engine → output → display and find the boundary.

## Display precision

Pass-through and rate precision: dashboard 0 dp, Excel and PDF exports 1 dp. Intentional - do not align. Executive dashboard reads cleaner at whole percentages; analyst exports carry the precision.
