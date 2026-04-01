import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAuth } from '../hooks/useAuth';
import useDivisions from '../hooks/useDivisions';
import { getSupabaseClient } from '../lib/supabase/client';
import { runFullAnalysis } from '../lib/engine/analysis';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const { user, tier, teamId } = useAuth();

  // ── Division state — loads async; gracefully degrades if table not yet migrated
  const {
    divisions,
    activeDivision,
    setActiveDivision,
    hasDivisions,
    divisionCount,
    divisionsBySector,
    consolidatableSectors,
    canConsolidate,
    ensureDivisionSector,
  } = useDivisions(teamId);

  // ── Comparison period state — entirely additive ──────────────────────────
  const [comparisonPeriodId, setComparisonPeriodId] = useState(null);
  const [comparisonResults,  setComparisonResults]  = useState(null);
  const [comparisonLoading,  setComparisonLoading]  = useState(false);

  // ── Single usePortfolio instance for the entire dashboard.
  // All consumers (portfolio.js, overview.js, pillar pages) read from here,
  // so SKU saves and period changes are immediately visible across all pages.
  // Pass activeDivision?.id so periods are filtered to the active division.
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
  } = usePortfolio(user?.id, tier, activeDivision?.id, teamId, ensureDivisionSector);

  const {
    results,
    running,
    ranAt,
    error: analysisError,
    run,
    clear,
    hasResults,
  } = useAnalysis(skuRows, tradeInvestment, activePeriod?.vertical);

  // ── Consolidation state — parallel to primary analysis; computed on demand ─
  const [isConsolidated,              setIsConsolidated]              = useState(false);
  const [consolidatedSector,          setConsolidatedSector]          = useState(null);
  const [consolidatedMonth,           setConsolidatedMonth]           = useState(null);
  const [consolidatedResults,         setConsolidatedResults]         = useState(null);
  const [consolidatedLoading,         setConsolidatedLoading]         = useState(false);
  const [consolidatedDivisionBreakdown, setConsolidatedDivisionBreakdown] = useState([]);
  const [consolidatedMissing,         setConsolidatedMissing]         = useState([]);

  const runConsolidation = useCallback(async (sector, monthLabel) => {
    if (!teamId) return;
    setConsolidatedLoading(true);
    setConsolidatedResults(null);

    try {
      const sb = getSupabaseClient();

      // 1. All non-archived divisions for this team with the given sector
      const { data: sectorDivisions, error: divError } = await sb
        .from('divisions')
        .select('id, name')
        .eq('team_id', teamId)
        .eq('sector', sector)
        .eq('is_archived', false);

      if (divError || !sectorDivisions?.length) {
        setConsolidatedLoading(false);
        return;
      }

      const divisionIds  = sectorDivisions.map(d => d.id);
      const divisionMap  = Object.fromEntries(sectorDivisions.map(d => [d.id, d.name]));

      // 2. Periods matching this month label in these divisions
      const { data: matchingPeriods, error: periodError } = await sb
        .from('periods')
        .select('id, label, division_id, vertical')
        .eq('label', monthLabel)
        .in('division_id', divisionIds);

      if (periodError) {
        setConsolidatedLoading(false);
        return;
      }

      // Track which divisions are missing data for this month
      const presentDivisionIds = new Set((matchingPeriods || []).map(p => p.division_id));
      setConsolidatedMissing(sectorDivisions.filter(d => !presentDivisionIds.has(d.id)));

      if (!matchingPeriods?.length) {
        setConsolidatedLoading(false);
        return;
      }

      const periodIds  = matchingPeriods.map(p => p.id);
      const isLogistics = sector === 'Logistics';
      const dataTable  = isLogistics ? 'logistics_rows'                  : 'sku_rows';
      const ciTable    = isLogistics ? 'logistics_commercial_investment'  : 'trade_investment';

      // 3. Fetch all rows from all matching periods
      const [rowRes, ciRes] = await Promise.all([
        sb.from(dataTable).select('*').in('period_id', periodIds),
        sb.from(ciTable).select('*').in('period_id', periodIds),
      ]);

      if (rowRes.error) {
        setConsolidatedLoading(false);
        return;
      }

      // 4. Tag each row with its division name
      const periodToDivision = Object.fromEntries(
        matchingPeriods.map(p => [p.id, divisionMap[p.division_id]])
      );

      const taggedRows = (rowRes.data || []).map(row => ({
        ...row,
        _division: periodToDivision[row.period_id] || 'Unknown',
      }));
      const taggedCI = (ciRes.data || []).map(row => ({
        ...row,
        _division: periodToDivision[row.period_id] || 'Unknown',
      }));

      // 5. Run consolidated analysis on merged dataset
      const vertical      = matchingPeriods[0]?.vertical || sector;
      const mergedResults = runFullAnalysis(taggedRows, taggedCI, vertical);

      // 6. Build per-division breakdown for KPI tiles in overview.js
      const breakdown = sectorDivisions
        .filter(d => presentDivisionIds.has(d.id))
        .map(div => {
          const divRows    = taggedRows.filter(r => r._division === div.name);
          const divCI      = taggedCI.filter(r => r._division === div.name);
          const divResults = divRows.length > 0 ? runFullAnalysis(divRows, divCI, vertical) : null;
          const rev        = divResults?.totalRevenue || 0;
          const margin     = divResults?.totalCurrentMargin || 0;
          const activeRows = divRows.filter(r => {
            const v = r.active;
            return v === 'Y' || v === 'y' || v === true || v === 'true';
          });
          return {
            divisionName:       div.name,
            divisionId:         div.id,
            rowCount:           activeRows.length,
            totalRevenue:       rev,
            totalMargin:        margin,
            portfolioMarginPct: rev > 0 ? (margin / rev * 100) : 0,
            revenueAtRisk:      divResults?.revenueAtRisk || 0,
          };
        });

      setConsolidatedResults(mergedResults);
      setConsolidatedDivisionBreakdown(breakdown);
      setConsolidatedSector(sector);
      setConsolidatedMonth(monthLabel);
      setIsConsolidated(true);

    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[runConsolidation] Error:', err.message);
      }
    } finally {
      setConsolidatedLoading(false);
    }
  }, [teamId]);

  const clearConsolidation = useCallback(() => {
    setIsConsolidated(false);
    setConsolidatedResults(null);
    setConsolidatedSector(null);
    setConsolidatedMonth(null);
    setConsolidatedDivisionBreakdown([]);
    setConsolidatedMissing([]);
  }, []);

  // Bridge: pillar pages read `activeResults`/`activeHasResults` which resolve
  // to consolidated results when in consolidated view, per-division otherwise.
  const activeResults    = isConsolidated ? consolidatedResults : results;
  const activeHasResults = isConsolidated ? Boolean(consolidatedResults) : hasResults;

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
      // Determine the correct tables for this comparison period
      const compPeriodMeta = periods?.find(p => p.id === periodId);
      const tableName   = compPeriodMeta?.vertical === 'Logistics' ? 'logistics_rows'                  : 'sku_rows';
      const ciTableName = compPeriodMeta?.vertical === 'Logistics' ? 'logistics_commercial_investment' : 'trade_investment';
      const [skuRes, tradeRes] = await Promise.all([
        sb.from(tableName).select('*').eq('period_id', periodId),
        sb.from(ciTableName).select('*').eq('period_id', periodId),
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
      // ── Division state ──────────────────────────────────────────
      divisions,
      activeDivision,
      setActiveDivision,
      hasDivisions,
      divisionCount,
      divisionsBySector,
      consolidatableSectors,
      canConsolidate,
      // ── Analysis results ────────────────────────────────────────
      results,
      running,
      ranAt,
      error: analysisError || portfolioError,
      run,
      hasResults,
      // Bridge: resolves to consolidated results when in consolidated view
      activeResults,
      activeHasResults,
      // ── Consolidation ────────────────────────────────────────────
      isConsolidated,
      consolidatedSector,
      consolidatedMonth,
      consolidatedResults,
      consolidatedLoading,
      consolidatedDivisionBreakdown,
      consolidatedMissing,
      runConsolidation,
      clearConsolidation,
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
