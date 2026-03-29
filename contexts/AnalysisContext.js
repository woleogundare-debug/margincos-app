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
  } = useAnalysis(skuRows, tradeInvestment, activePeriod?.vertical);

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
      // Determine the correct table for this comparison period
      const compPeriodMeta = periods?.find(p => p.id === periodId);
      const tableName = compPeriodMeta?.vertical === 'Logistics' ? 'logistics_rows' : 'sku_rows';
      const [skuRes, tradeRes] = await Promise.all([
        sb.from(tableName).select('*').eq('period_id', periodId),
        sb.from('trade_investment').select('*').eq('period_id', periodId),
      ]);
      if (skuRes.error) throw skuRes.error;
      if (tradeRes.error) throw tradeRes.error;
      const compResults = runFullAnalysis(skuRes.data || [], tradeRes.data || [], compPeriodMeta?.vertical);
      setComparisonResults(compResults);
    } catch (err) {
      console.error('[loadComparisonPeriod] Failed:', err.message);
      setComparisonResults(null);
    } finally {
      setComparisonLoading(false);
    }
  }, [user?.id, periods]);

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
  // NOTE: We parse the period LABEL ("March 2026", "February 2026") — not created_at.
  // created_at reflects when the data was imported, which can be out of order
  // (e.g. February data imported after March data). The label always carries the
  // true reporting month. new Date("March 2026") → Mar 1 2026, which is reliable.
  const parseReportingMonth = (label) => {
    if (!label) return 0;
    const d = new Date(label);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const chronologicalDelta = useMemo(() => {
    if (!results || !comparisonResults || !activePeriod || !comparisonPeriodMeta) return null;
    const activeTime = parseReportingMonth(activePeriod.label);
    const compTime   = parseReportingMonth(comparisonPeriodMeta.label);
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
