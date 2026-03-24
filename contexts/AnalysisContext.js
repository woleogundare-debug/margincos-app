import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAuth } from '../hooks/useAuth';
import { getSupabaseClient } from '../lib/supabase/client';
import { runFullAnalysis } from '../lib/engine/analysis';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const { user, tier } = useAuth();

  // ── Comparison period state — entirely additive ──────────────────────────
  const [comparisonPeriodId, setComparisonPeriodId] = useState(null);
  const [comparisonResults,  setComparisonResults]  = useState(null);
  const [comparisonLoading,  setComparisonLoading]  = useState(false);

  // ── Single usePortfolio instance for the entire dashboard.
  // All consumers (portfolio.js, overview.js, pillar pages) read from here,
  // so SKU saves and period changes are immediately visible across all pages.
  const {
    periods,
    activePeriod,
    skuRows,
    tradeInvestment,
    loading,
    saving,
    error: portfolioError,
    createPeriod,
    selectPeriod,
    loadPeriods,
    deletePeriod,
    saveSku,
    debouncedSaveSku,
    addSku,
    deleteSku,
    saveTradeInvestment,
    activeSkuCount,
    completeSkuCount,
  } = usePortfolio(user?.id, tier);

  const {
    results,
    running,
    ranAt,
    error: analysisError,
    run,
    clear,
    hasResults,
  } = useAnalysis(skuRows, tradeInvestment);

  // ── Load a second period for comparison — does NOT touch primary state ───
  const loadComparisonPeriod = useCallback(async (periodId) => {
    if (!periodId || !user?.id) {
      setComparisonPeriodId(null);
      setComparisonResults(null);
      return;
    }
    setComparisonLoading(true);
    setComparisonPeriodId(periodId);
    try {
      const sb = getSupabaseClient();
      const [skuRes, tradeRes] = await Promise.all([
        sb.from('sku_rows').select('*').eq('period_id', periodId),
        sb.from('trade_investment').select('*').eq('period_id', periodId),
      ]);
      if (skuRes.error) throw skuRes.error;
      if (tradeRes.error) throw tradeRes.error;
      const compResults = runFullAnalysis(skuRes.data || [], tradeRes.data || []);
      setComparisonResults(compResults);
    } catch (err) {
      console.error('[loadComparisonPeriod] Failed:', err.message);
      setComparisonResults(null);
    } finally {
      setComparisonLoading(false);
    }
  }, [user?.id]);

  const clearComparison = useCallback(() => {
    setComparisonPeriodId(null);
    setComparisonResults(null);
  }, []);

  // Auto-clear results AND comparison when the active period changes
  // This resets hasResults to false so the auto-run in overview.js fires with the new period's data
  useEffect(() => {
    clear(); // wipe stale results so hasResults resets to false
    setComparisonPeriodId(null);
    setComparisonResults(null);
  }, [activePeriod?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive the comparison period's metadata from the periods array
  const comparisonPeriodMeta = useMemo(() => {
    if (!comparisonPeriodId || !periods?.length) return null;
    return periods.find(p => p.id === comparisonPeriodId) || null;
  }, [comparisonPeriodId, periods]);

  // Chronological ordering: delta = later period results − earlier period results.
  // Positive delta always means the metric improved over time, regardless of which
  // period the user has active vs. selected as comparison.
  const chronologicalDelta = useMemo(() => {
    if (!results || !comparisonResults || !activePeriod || !comparisonPeriodMeta) return null;
    const activeTime = new Date(activePeriod.created_at || 0).getTime();
    const compTime   = new Date(comparisonPeriodMeta.created_at || 0).getTime();
    if (activeTime >= compTime) {
      // Active period is later (or equal) — delta = active − comparison
      return { laterResults: results, earlierResults: comparisonResults,
               laterPeriod: activePeriod, earlierPeriod: comparisonPeriodMeta };
    } else {
      // Comparison period is later — delta = comparison − active
      return { laterResults: comparisonResults, earlierResults: results,
               laterPeriod: comparisonPeriodMeta, earlierPeriod: activePeriod };
    }
  }, [results, comparisonResults, activePeriod, comparisonPeriodMeta]);

  return (
    <AnalysisContext.Provider value={{
      // ── Portfolio data ───────────────────────────────────────────
      periods,
      activePeriod,
      skuRows,
      tradeInvestment,
      loading,
      portfolioLoading: loading, // backward-compat alias used by overview.js
      saving,
      // ── Portfolio CRUD ──────────────────────────────────────────
      createPeriod,
      selectPeriod,
      loadPeriods,
      deletePeriod,
      saveSku,
      debouncedSaveSku,
      addSku,
      deleteSku,
      saveTradeInvestment,
      activeSkuCount,
      completeSkuCount,
      // ── Analysis results ────────────────────────────────────────
      results,
      running,
      ranAt,
      error: analysisError || portfolioError,
      run,
      hasResults,
      // ── Comparison period ────────────────────────────────────────
      comparisonPeriodId,
      comparisonResults,
      comparisonPeriodMeta,
      comparisonLoading,
      loadComparisonPeriod,
      clearComparison,
      // ── Chronological delta (later − earlier, always) ────────────
      chronologicalDelta,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysisContext must be used within AnalysisProvider');
  return ctx;
}
