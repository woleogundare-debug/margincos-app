-- Add recoverable_pool_id to action_items
-- Purpose: explicit grouping key for actions that share an underlying recoverable pool.
-- Aggregator semantics: SUM DISTINCT by pool_id where pool_id IS NOT NULL,
-- SUM by row where pool_id IS NULL. Future-proofs against overlapping action emissions.

ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS recoverable_pool_id text;

COMMENT ON COLUMN public.action_items.recoverable_pool_id IS
  'Optional grouping key. When two or more actions reference the same underlying recoverable pool (e.g. one M2 scenario producing both an immediate and a structural intervention), they share a pool_id and the aggregator counts the recoverable once. NULL means standalone - the action contributes its full value to any sum.';

CREATE INDEX IF NOT EXISTS action_items_recoverable_pool_id_idx
  ON public.action_items (recoverable_pool_id)
  WHERE recoverable_pool_id IS NOT NULL;

-- Tidy: drop the redundant period_id index flagged in the diagnostic (Q4)
DROP INDEX IF EXISTS public.idx_action_items_period_id;
-- action_items_period_id_idx remains as the canonical index on period_id.
