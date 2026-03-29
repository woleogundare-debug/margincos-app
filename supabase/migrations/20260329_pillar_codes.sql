-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Convert action_items.pillar from display strings to short codes
-- Ticket:    sectorConfig foundation refactor — Package 1, Phase 1
-- Date:      2026-03-29
-- Safe to run multiple times (idempotent WHERE clauses).
-- ─────────────────────────────────────────────────────────────────────────────

-- P1 — Pricing Intelligence
UPDATE action_items
SET    pillar = 'P1'
WHERE  pillar = 'Pricing Intelligence';

-- P2 — Cost Pass-Through
UPDATE action_items
SET    pillar = 'P2'
WHERE  pillar = 'Cost Pass-Through';

-- P3 — Channel Economics
UPDATE action_items
SET    pillar = 'P3'
WHERE  pillar = 'Channel Economics';

-- P4 — Trade Execution
UPDATE action_items
SET    pillar = 'P4'
WHERE  pillar = 'Trade Execution';

-- M1 — SKU Rationalisation (legacy string) → Portfolio Rationalisation code
UPDATE action_items
SET    pillar = 'M1'
WHERE  pillar IN ('SKU Rationalisation', 'Portfolio Rationalisation');

-- M2 — Inflation Resilience (legacy) → Forward Scenario Engine code
UPDATE action_items
SET    pillar = 'M2'
WHERE  pillar IN ('Inflation Resilience', 'Forward Scenario Engine');

-- M3 — Trade Spend ROI (legacy) → Commercial Spend ROI Analyser code
UPDATE action_items
SET    pillar = 'M3'
WHERE  pillar IN ('Trade Spend ROI', 'Commercial Spend ROI Analyser');

-- M4 — Distributor Performance (legacy) → Partner Performance Scorecard code
UPDATE action_items
SET    pillar = 'M4'
WHERE  pillar IN ('Distributor Performance', 'Partner Performance Scorecard');

-- Verification: confirm no legacy display strings remain
-- (Run this SELECT after the migration to validate zero rows)
-- SELECT DISTINCT pillar FROM action_items
-- WHERE  pillar NOT IN ('P1','P2','P3','P4','M1','M2','M3','M4')
-- AND    pillar IS NOT NULL;
