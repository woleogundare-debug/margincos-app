import { createContext, useContext } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAuth } from '../hooks/useAuth';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const { user } = useAuth();

  // Single usePortfolio instance for the entire dashboard.
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
  } = usePortfolio(user?.id);

  const {
    results,
    running,
    ranAt,
    error: analysisError,
    run,
    hasResults,
  } = useAnalysis(skuRows, tradeInvestment);

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
