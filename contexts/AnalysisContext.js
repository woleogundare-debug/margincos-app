import { createContext, useContext } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAuth } from '../hooks/useAuth';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const { user } = useAuth();

  const {
    skuRows,
    tradeInvestment,
    periods,
    activePeriod,
    loading: portfolioLoading,
  } = usePortfolio(user?.id);

  const {
    results,
    running,
    ranAt,
    error,
    run,
    hasResults,
  } = useAnalysis(skuRows, tradeInvestment);

  return (
    <AnalysisContext.Provider value={{
      skuRows,
      tradeInvestment,
      periods,
      activePeriod,
      portfolioLoading,
      results,
      running,
      ranAt,
      error,
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
