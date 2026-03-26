import { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * ExportButton — teal secondary button with spinner during export.
 * Renders nothing if `show` is false (tier gate handled by parent).
 *
 * Props:
 *   onExport  — async function; called on click; must not throw (catch internally)
 *   label     — string; defaults to "Export to Excel"
 *   show      — boolean; if false, renders null (tier gate)
 */
export default function ExportButton({ onExport, label = 'Export to Excel', show = true }) {
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onExport();
    } catch (err) {
      console.error('[ExportButton] export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '6px',
        padding:        '7px 14px',
        borderRadius:   '8px',
        border:         '1px solid rgba(13, 143, 143, 0.35)',
        background:     '#E6F5F5',
        color:          '#0D8F8F',
        fontSize:       '13px',
        fontWeight:     600,
        fontFamily:     "'DM Sans', system-ui, sans-serif",
        cursor:         loading ? 'not-allowed' : 'pointer',
        opacity:        loading ? 0.65 : 1,
        transition:     'opacity 0.15s',
        whiteSpace:     'nowrap',
      }}
    >
      <Download size={14} strokeWidth={2.2} />
      {loading ? 'Exporting…' : label}
    </button>
  );
}
