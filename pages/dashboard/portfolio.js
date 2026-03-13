import { useState } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PeriodSelector } from '../../components/portfolio/PeriodSelector';
import { SkuGrid } from '../../components/portfolio/SkuGrid';
import { SkuDetailPanel } from '../../components/portfolio/SkuDetailPanel';
import { TradeInvestmentForm } from '../../components/portfolio/TradeInvestmentForm';
import { EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import Link from 'next/link';

export default function PortfolioPage() {
  const { user } = useAuth();
  const {
    periods, activePeriod, skuRows, tradeInvestment,
    loading, saving,
    createPeriod, selectPeriod,
    saveSku, addSku, deleteSku,
    saveTradeInvestment,
    activeSkuCount, completeSkuCount,
  } = usePortfolio(user?.id);

  const [selectedRow, setSelectedRow] = useState(null);

  const handleAddSku = async () => {
    await addSku();
  };

  const handleSaveSku = async (row) => {
    await saveSku(row);
    if (selectedRow && (selectedRow.id === row.id || selectedRow._tempId === row._tempId)) {
      setSelectedRow(row);
    }
  };

  const handleBulkImport = async (rows) => {
    // Save all valid CSV rows in parallel batches of 5
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
      <DashboardLayout title="Portfolio Manager" activePeriod={activePeriod}>
        {/* Period selector bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <PeriodSelector
            periods={periods}
            activePeriod={activePeriod}
            onSelect={selectPeriod}
            onCreate={createPeriod}
            loading={loading}
          />
          {activePeriod && activeSkuCount > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">{activeSkuCount} SKUs</p>
                <p className="text-xs text-slate-400">{completeSkuCount} complete</p>
              </div>
              <Link href="/dashboard/overview">
                <Button variant="navy" size="md">
                  Run Analysis →
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* No period state */}
        {!activePeriod && !loading && (
          <EmptyState
            icon="📅"
            title="No period selected"
            description="Create your first analysis period to start entering SKU data. Each period represents a point-in-time snapshot of your portfolio."
            action={null}
          />
        )}

        {/* SKU Grid */}
        {activePeriod && (
          <>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <svg className="animate-spin h-4 w-4 text-teal" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading portfolio…
                </div>
              </div>
            ) : (
              <SkuGrid
                skuRows={skuRows}
                onSave={handleSaveSku}
                onAdd={handleAddSku}
                onDelete={deleteSku}
                onRowClick={setSelectedRow}
                onBulkImport={handleBulkImport}
                saving={saving}
                activePeriod={activePeriod}
              />
            )}

            {/* Trade Investment Form */}
            {!loading && (
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
