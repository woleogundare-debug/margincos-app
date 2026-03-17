import React, { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import MarginCOSReport from './MarginCOSReport';

/**
 * Client-side PDF report generation button.
 * Must be loaded with dynamic(() => import(...), { ssr: false }).
 */
export default function DownloadReportButton({ results, companyName, periodLabel, isEnterprise }) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!results || generating) return;
    setGenerating(true);

    try {
      const blob = await pdf(
        <MarginCOSReport
          results={results}
          companyName={companyName}
          periodLabel={periodLabel}
          isEnterprise={isEnterprise}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (companyName || 'MarginCOS')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 40);
      a.download = `${safeName}-Margin-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Report generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [results, companyName, periodLabel, isEnterprise, generating]);

  if (!results) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
      style={{ backgroundColor: '#1B2A4A' }}
    >
      {generating ? (
        <>
          <SpinnerIcon />
          Generating PDF…
        </>
      ) : (
        <>
          <DownloadIcon />
          Download Report
        </>
      )}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
