import { useState, useCallback, useMemo } from 'react';
import { runFullAnalysis } from '../lib/engine/analysis';

export function useAnalysis(skuRows, tradeInvestment) {
  const [results,   setResults]   = useState(null);
  const [running,   setRunning]   = useState(false);
  const [ranAt,     setRanAt]     = useState(null);
  const [error,     setError]     = useState(null);

  const run = useCallback(() => {
    if (!skuRows || skuRows.length === 0) {
      setError('No SKU data to analyse. Add SKUs in Portfolio Manager first.');
      return;
    }
    setRunning(true);
    setError(null);
    // Use setTimeout to yield to the UI before the computation
    setTimeout(() => {
      try {
        const result = runFullAnalysis(skuRows, tradeInvestment || []);
        if (!result) {
          setError('No active SKUs found. Mark at least one SKU as active.');
        } else {
          setResults(result);
          setRanAt(new Date());
        }
      } catch (e) {
        setError('Analysis failed: ' + e.message);
      } finally {
        setRunning(false);
      }
    }, 50);
  }, [skuRows, tradeInvestment]);

  const clear = useCallback(() => {
    setResults(null);
    setRanAt(null);
    setError(null);
  }, []);

  const hasResults = Boolean(results);

  return { results, running, ranAt, error, run, clear, hasResults };
}
