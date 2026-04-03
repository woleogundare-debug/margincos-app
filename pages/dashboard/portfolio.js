import { useCurrency } from '../../contexts/CurrencyContext';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PeriodSelector } from '../../components/portfolio/PeriodSelector';
import { SkuGrid } from '../../components/portfolio/SkuGrid';
import { SkuDetailPanel } from '../../components/portfolio/SkuDetailPanel';
import { TradeInvestmentForm } from '../../components/portfolio/TradeInvestmentForm';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { getSupabaseClient } from '../../lib/supabase/client';
import { TIER_LIMITS } from '../../lib/constants';
import { getSectorConfig } from '../../lib/sectorConfig';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ExportButton from '../../components/ExportButton';
import { exportPortfolio } from '../../lib/exportToExcel';

// nairaCompact defined inside component via useCurrency

export default function PortfolioPage() {
  const { currSym } = useCurrency();
  const nairaCompact = (v) => {
    if (!v || v === 0) return currSym + '0';
    if (v >= 1e9) return currSym + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return currSym + (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return currSym + (v / 1e3).toFixed(0) + 'K';
    return currSym + v.toFixed(0);
  };
  const { isProfessional, isEnterprise, tier } = useAuth();
  const {
    periods, activePeriod, skuRows, tradeInvestment,
    loading, saving,
    createPeriod, selectPeriod, deletePeriod,
    saveSku, addSku, deleteSku,
    saveTradeInvestment,
    activeSkuCount, completeSkuCount,
    divisions, activeDivision, setActiveDivision, hasDivisions,
    canConsolidate, consolidatableSectors,
    isConsolidated, consolidatedSector, consolidatedMonth,
    consolidatedDivisionBreakdown, consolidatedMissing, consolidatedLoading,
    consolidatedRows,
    runConsolidation, clearConsolidation,
  } = useAnalysisContext();

  // In consolidated mode the grid is read-only and sourced from merged tagged rows.
  // In normal mode it uses the active division's skuRows.
  const gridRows = isConsolidated ? consolidatedRows : skuRows;

  const cfg = getSectorConfig(activePeriod?.vertical);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('sku'); // 'sku' or 'trade'
  const [skuLimitError, setSkuLimitError] = useState(null);
  const [importProgress, setImportProgress] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);

  // Consolidation picker state
  const [showConsolidationPicker, setShowConsolidationPicker] = useState(false);
  const [selectedConsolidationMonth, setSelectedConsolidationMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);

  // Fetch unique period labels available across all consolidatable divisions
  useEffect(() => {
    if (!canConsolidate || !consolidatableSectors[0]) return;
    const sectorDivIds = consolidatableSectors[0].divisions.map(d => d.id);
    const sb = getSupabaseClient();
    sb.from('periods')
      .select('label')
      .in('division_id', sectorDivIds)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(p => p.label))].sort((a, b) => {
            // Sort by parsed date, most recent first
            return new Date(b).getTime() - new Date(a).getTime();
          });
          setAvailableMonths(unique);
          if (unique.length > 0 && !selectedConsolidationMonth) {
            setSelectedConsolidationMonth(unique[0]);
          }
        }
      });
  }, [canConsolidate, consolidatableSectors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tier enforcement helpers
  const skuLimit   = TIER_LIMITS[tier]?.maxSkus ?? null;
  const tierLabel  = tier === 'essentials' ? 'Essentials' : tier === 'professional' ? 'Professional' : tier;
  const isOverSkuLimit = skuLimit !== null && activeSkuCount > skuLimit;

  // Compute total revenue from SKU rows
  const totalRevenue = useMemo(() => {
    return skuRows.reduce((sum, r) => {
      const rrp = parseFloat(r.rrp) || 0;
      const vol = parseFloat(r.monthly_volume_units) || 0;
      return sum + (rrp * vol);
    }, 0);
  }, [skuRows]);

  const handleAddSku = useCallback(async () => {
    setActiveTab('sku');
    const result = await addSku();
    if (result?.error) {
      setSkuLimitError(result.message);
    } else {
      setSkuLimitError(null);
    }
  }, [addSku]);

  const handleSaveSku = async (row) => {
    await saveSku(row);
    if (selectedRow && (selectedRow.id === row.id || selectedRow._tempId === row._tempId)) {
      setSelectedRow(row);
    }
  };

  const handleBulkImport = useCallback(async (rows) => {
    const limit = TIER_LIMITS[tier]?.maxSkus ?? null;

    // Hard block — reject the entire import if it would exceed the tier cap
    if (limit !== null && activeSkuCount + rows.length > limit) {
      setSkuLimitError(`Your ${tierLabel} plan supports up to ${limit} active ${cfg.unitPlural}. Upgrade your plan to continue.`);
      return;
    }

    setImportProgress(`Importing ${rows.length} ${rows.length !== 1 ? cfg.unitPlural : cfg.unit}…`);
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.all(batch.map(row => saveSku({
        ...row,
        _tempId: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      })));
      setImportProgress(`Importing ${rows.length} ${rows.length !== 1 ? cfg.unitPlural : cfg.unit}… (${Math.min(i + batchSize, rows.length)}/${rows.length})`);
    }
    setImportProgress('');
  }, [tier, activeSkuCount, saveSku, cfg]);

  return (
    <>
      <Head>
        <title>Portfolio Manager | MarginCOS</title>
      </Head>
      <>
        {/* ── Division switcher — shown for multi-division clients ── */}
        {hasDivisions && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Division</span>
            <select
              value={isConsolidated ? '__consolidated__' : (activeDivision?.id || '')}
              onChange={e => {
                if (e.target.value === '__consolidated__') {
                  clearConsolidation();
                  setShowConsolidationPicker(true);
                } else {
                  clearConsolidation();
                  setShowConsolidationPicker(false);
                  const div = divisions.find(d => d.id === e.target.value);
                  if (div) setActiveDivision(div);
                }
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-navy focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              style={{ color: '#1B2A4A' }}>
              {divisions.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
              {canConsolidate && (
                <option value="__consolidated__">
                  ⬡ Consolidated View
                </option>
              )}
            </select>
          </div>
        )}

        {/* ── Consolidation month picker ── */}
        {showConsolidationPicker && !isConsolidated && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Consolidated View</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a month to merge all {consolidatableSectors[0]?.sector} divisions into a single analysis.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <select
                value={selectedConsolidationMonth}
                onChange={e => setSelectedConsolidationMonth(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                style={{ color: '#1B2A4A' }}>
                <option value="">Select month…</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedConsolidationMonth && consolidatableSectors[0]) {
                    runConsolidation(consolidatableSectors[0].sector, selectedConsolidationMonth);
                    setShowConsolidationPicker(false);
                  }
                }}
                disabled={!selectedConsolidationMonth || consolidatedLoading}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#0D8F8F' }}>
                {consolidatedLoading ? 'Consolidating…' : 'Consolidate'}
              </button>
              <button
                onClick={() => { clearConsolidation(); setShowConsolidationPicker(false); }}
                className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {consolidatableSectors[0]?.divisions.map(div => (
                <div key={div.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></span>
                  {div.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Consolidated active banner ── */}
        {isConsolidated && consolidatedDivisionBreakdown.length > 0 && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                  Consolidated View
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-0.5">
                  {consolidatedSector} — {consolidatedMonth}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {consolidatedDivisionBreakdown.length} division{consolidatedDivisionBreakdown.length !== 1 ? 's' : ''} ·{' '}
                  {consolidatedDivisionBreakdown.reduce((s, d) => s + d.rowCount, 0)} active{' '}
                  {consolidatedSector === 'Logistics' ? 'lanes' : 'SKUs'}
                  {consolidatedMissing.length > 0 && (
                    <span className="text-amber-600 ml-2">
                      · {consolidatedMissing.map(d => d.name).join(', ')} missing data for this month
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => { clearConsolidation(); }}
                className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap flex-shrink-0 mt-1">
                Exit Consolidated View ×
              </button>
            </div>
          </div>
        )}

        {/* ── No period empty state ── */}
        {!activePeriod && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-6">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>M</span>
            </div>
            <h2 className="text-xl font-bold text-navy mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Start your first analysis period
            </h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8">
              {cfg.narrative.periodHint}
            </p>
            <PeriodSelector
              periods={periods}
              activePeriod={activePeriod}
              onSelect={selectPeriod}
              onCreate={createPeriod}
              onDelete={deletePeriod}
              loading={loading}
              divisions={divisions}
            />
          </div>
        )}

        {/* ── Loading ── */}
        {activePeriod && loading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <svg className="animate-spin h-4 w-4 text-teal" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading portfolio...
            </div>
          </div>
        )}

        {/* ── Active period content ── */}
        {activePeriod && !loading && (
          <>
            {/* Desktop header — title above, controls below */}
            <div className="hidden md:block mb-6">
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#1B2A4A', marginBottom: '16px' }}>
                Portfolio Manager
              </h1>
              <div className="flex items-center justify-between gap-3">
                {/* Left group: period selector + badges */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <PeriodSelector
                    periods={periods}
                    activePeriod={activePeriod}
                    onSelect={selectPeriod}
                    onCreate={createPeriod}
                    onDelete={deletePeriod}
                    loading={loading}
                    divisions={divisions}
                  />
                  {activePeriod && activeSkuCount > 0 && (
                    <>
                      <span style={{
                        backgroundColor: '#1B2A4A',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap',
                      }}>
                        {activeSkuCount} {activeSkuCount !== 1 ? cfg.unitPlural : cfg.unit}
                      </span>
                      {totalRevenue > 0 && (
                        <span style={{
                          backgroundColor: '#1B2A4A',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontFamily: "'DM Sans', sans-serif",
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                        }}>
                          {nairaCompact(totalRevenue)} revenue
                        </span>
                      )}
                    </>
                  )}
                </div>
                {/* Right group: action buttons — hidden in consolidated mode (read-only) */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {!isConsolidated && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => {
                        const a = document.createElement('a');
                        a.href = cfg.templateFile;
                        a.download = cfg.templateFilename;
                        a.click();
                      }}>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg> Template
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => {
                        setActiveTab('sku');
                        document.getElementById('csv-import-trigger')?.click();
                      }}>
                        <ArrowUpTrayIcon className="h-4 w-4" /> Import
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleAddSku}>
                        <PlusIcon className="h-4 w-4" /> {cfg.addButtonLabel}
                      </Button>
                    </>
                  )}
                  {isOverSkuLimit ? (
                    <button
                      onClick={() => setSkuLimitError(`Your ${tierLabel} plan supports up to ${skuLimit} active ${cfg.unitPlural}. You have ${activeSkuCount} — upgrade your plan to run analysis.`)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed shadow-sm"
                      style={{ backgroundColor: '#C0392B' }}
                    >
                      Run Analysis
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  ) : (
                    <Link href="/dashboard/overview">
                      <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: '#C0392B' }}>
                        Run Analysis
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Row 1 — Mobile header */}
            <div className="md:hidden mb-3">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold text-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Portfolio Manager
                </h1>
                {/* Mobile action icons — hidden in consolidated mode */}
                {!isConsolidated && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => {
                      setActiveTab('sku');
                      document.getElementById('csv-import-trigger')?.click();
                    }} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-navy hover:border-navy transition-colors" title="Import Data">
                      <ArrowUpTrayIcon className="h-4 w-4" />
                    </button>
                    <button onClick={handleAddSku} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-navy hover:border-navy transition-colors" title={cfg.addButtonLabel}>
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = cfg.templateFile;
                      a.download = cfg.templateFilename;
                      a.click();
                    }} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-navy hover:border-navy transition-colors" title="Download Template">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {isOverSkuLimit ? (
                <button
                  onClick={() => setSkuLimitError(`Your ${tierLabel} plan supports up to ${skuLimit} active ${cfg.unitPlural}. You have ${activeSkuCount} — upgrade your plan to run analysis.`)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed shadow-sm"
                  style={{ backgroundColor: '#C0392B' }}
                >
                  Run Analysis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              ) : (
                <Link href="/dashboard/overview">
                  <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: '#C0392B' }}>
                    Run Analysis
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
              )}
            </div>

            {/* Row 2 — Period selector (mobile only) */}
            <div className="md:hidden flex items-center gap-3 mb-4">
              <PeriodSelector
                periods={periods}
                activePeriod={activePeriod}
                onSelect={selectPeriod}
                onCreate={createPeriod}
                onDelete={deletePeriod}
                loading={loading}
                divisions={divisions}
              />
            </div>

            {/* Import progress indicator */}
            {importProgress && (
              <p style={{ fontSize: '12px', color: '#0D8F8F', marginBottom: '8px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                {importProgress}
              </p>
            )}

            {/* Tab bar: Portfolio / Trade Investment — Trade tab hidden in consolidated mode */}
            <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
              {[
                { key: 'sku',   label: cfg.portfolioTab },
                ...(!isConsolidated ? [{ key: 'trade', label: activePeriod?.vertical === 'Logistics' ? 'Commercial Investment' : 'Trade Investment' }] : []),
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all relative ${
                    activeTab === tab.key
                      ? 'text-navy'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-t-full" />
                  )}
                </button>
              ))}
              {activeTab === 'sku' && !isConsolidated && (
                <div className="ml-auto pb-2">
                  <ExportButton
                    show={(isProfessional || isEnterprise) && skuRows.length > 0}
                    onExport={() => exportPortfolio(skuRows, activePeriod?.label)}
                  />
                </div>
              )}
            </div>

            {/* SKU limit error banner */}
            {skuLimitError && (
              <div className="flex items-start justify-between gap-3 px-4 py-3 mb-4 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                <div className="flex items-start gap-2 text-amber-800">
                  <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>
                    {skuLimitError}{' '}
                    <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors">
                      View plans →
                    </Link>
                  </span>
                </div>
                <button
                  onClick={() => setSkuLimitError(null)}
                  className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* SKU Grid tab */}
            {activeTab === 'sku' && (
              <>
                <SkuGrid
                  skuRows={gridRows.slice(0, visibleCount)}
                  onSave={handleSaveSku}
                  onAdd={handleAddSku}
                  onDelete={deleteSku}
                  onRowClick={isConsolidated ? null : setSelectedRow}
                  onBulkImport={handleBulkImport}
                  saving={saving}
                  activePeriod={activePeriod}
                  isProfessional={isProfessional}
                  isEnterprise={isEnterprise}
                  readOnly={isConsolidated}
                />
                {gridRows.length > visibleCount && (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <button
                      onClick={() => setVisibleCount(v => v + 100)}
                      style={{
                        fontSize: '13px', fontWeight: 600, color: '#0D8F8F',
                        background: 'rgba(13,143,143,0.08)', border: '1px solid rgba(13,143,143,0.2)',
                        borderRadius: '8px', padding: '8px 20px', cursor: 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    >
                      Show more ({skuRows.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Trade / Commercial Investment tab */}
            {activeTab === 'trade' && (
              <TradeInvestmentForm
                tradeInvestment={tradeInvestment}
                onSave={saveTradeInvestment}
                saving={saving}
                periodId={activePeriod?.id}
                cfg={cfg}
              />
            )}
          </>
        )}

        {/* SKU Detail Panel */}
        {selectedRow && (
          <SkuDetailPanel
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
            onSave={handleSaveSku}
            saving={saving}
            vertical={activePeriod?.vertical}
          />
        )}
      </>
    </>
  );
}

PortfolioPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
