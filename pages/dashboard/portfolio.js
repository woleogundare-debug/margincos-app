import { useState, useMemo } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PeriodSelector } from '../../components/portfolio/PeriodSelector';
import { SkuGrid } from '../../components/portfolio/SkuGrid';
import { SkuDetailPanel } from '../../components/portfolio/SkuDetailPanel';
import { TradeInvestmentForm } from '../../components/portfolio/TradeInvestmentForm';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

function nairaCompact(v) {
  if (!v || v === 0) return '₦0';
  if (v >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '₦' + (v / 1e3).toFixed(0) + 'K';
  return '₦' + v.toFixed(0);
}

export default function PortfolioPage() {
  const { user, isProfessional, isEnterprise } = useAuth();
  const {
    periods, activePeriod, skuRows, tradeInvestment,
    loading, saving,
    createPeriod, selectPeriod,
    saveSku, addSku, deleteSku,
    saveTradeInvestment,
    activeSkuCount, completeSkuCount,
  } = usePortfolio(user?.id);

  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('sku'); // 'sku' or 'trade'

  // Compute total revenue from SKU rows
  const totalRevenue = useMemo(() => {
    return skuRows.reduce((sum, r) => {
      const rrp = parseFloat(r.rrp) || 0;
      const vol = parseFloat(r.monthly_volume_units) || 0;
      return sum + (rrp * vol);
    }, 0);
  }, [skuRows]);

  const handleAddSku = async () => {
    setActiveTab('sku');
    await addSku();
  };

  const handleSaveSku = async (row) => {
    await saveSku(row);
    if (selectedRow && (selectedRow.id === row.id || selectedRow._tempId === row._tempId)) {
      setSelectedRow(row);
    }
  };

  const handleBulkImport = async (rows) => {
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.all(batch.map(row => saveSku({
        ...row,
        _tempId: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      })));
    }
  };

  return (
    <>
      <Head>
        <title>Portfolio Manager — MarginCOS</title>
      </Head>
      <DashboardLayout activePeriod={activePeriod}>
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
              Each period represents a point-in-time snapshot of your portfolio. Create one to begin entering SKU data.
            </p>
            <PeriodSelector
              periods={periods}
              activePeriod={activePeriod}
              onSelect={selectPeriod}
              onCreate={createPeriod}
              loading={loading}
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
            {/* Row 1 — Page title + primary actions */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
                Portfolio Manager
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => {
                  setActiveTab('sku');
                  // trigger CSV file picker via SkuGrid ref — handled inside SkuGrid
                  document.getElementById('csv-import-trigger')?.click();
                }}>
                  <ArrowUpTrayIcon className="h-4 w-4" /> Import CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddSku}>
                  <PlusIcon className="h-4 w-4" /> Add SKU
                </Button>
                <Link href="/dashboard/overview">
                  <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: '#C0392B' }}>
                    Run Analysis
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>

            {/* Row 2 — Period selector pill + portfolio summary */}
            <div className="flex items-center gap-4 mb-6">
              <PeriodSelector
                periods={periods}
                activePeriod={activePeriod}
                onSelect={selectPeriod}
                onCreate={createPeriod}
                loading={loading}
              />
              {activeSkuCount > 0 && (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{activeSkuCount} SKUs</span>
                  {totalRevenue > 0 && (
                    <>
                      <span className="opacity-40">·</span>
                      <span>{nairaCompact(totalRevenue)} revenue</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tab bar: SKU Grid / Trade Investment */}
            <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
              {[
                { key: 'sku', label: 'SKU Portfolio' },
                { key: 'trade', label: 'Trade Investment' },
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
            </div>

            {/* SKU Grid tab */}
            {activeTab === 'sku' && (
              <SkuGrid
                skuRows={skuRows}
                onSave={handleSaveSku}
                onAdd={handleAddSku}
                onDelete={deleteSku}
                onRowClick={setSelectedRow}
                onBulkImport={handleBulkImport}
                saving={saving}
                activePeriod={activePeriod}
                isProfessional={isProfessional}
                isEnterprise={isEnterprise}
              />
            )}

            {/* Trade Investment tab */}
            {activeTab === 'trade' && (
              <TradeInvestmentForm
                tradeInvestment={tradeInvestment}
                onSave={saveTradeInvestment}
                saving={saving}
                periodId={activePeriod?.id}
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
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return auth;
  return { props: {} };
}
