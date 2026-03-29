import { useState, useCallback, useMemo } from 'react';
import { runFullAnalysis } from '../lib/engine/analysis';
import { getSectorConfig } from '../lib/sectorConfig';

export function useAnalysis(skuRows, tradeInvestment, vertical) {
  const cfg = getSectorConfig(vertical);
  const [results,   setResults]   = useState(null);
  const [running,   setRunning]   = useState(false);
  const [ranAt,     setRanAt]     = useState(null);
  const [error,     setError]     = useState(null);

  const run = useCallback(() => {
    if (!skuRows || skuRows.length === 0) {
      setError(`No ${cfg.unit} data to analyse. Add ${cfg.unitPlural} in Portfolio Manager first.`);
      return;
    }
    setRunning(true);
    setError(null);
    // Use setTimeout to yield to the UI before the computation
    setTimeout(() => {
      try {
        const result = runFullAnalysis(skuRows, tradeInvestment || [], vertical);
        if (!result) {
          setError(`No active ${cfg.unitPlural} found. Mark at least one ${cfg.unit} as active.`);
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
  }, [skuRows, tradeInvestment, vertical]);

  const clear = useCallback(() => {
    setResults(null);
    setRanAt(null);
    setError(null);
  }, []);

  const hasResults = Boolean(results);

  return { results, running, ranAt, error, run, clear, hasResults };
}
