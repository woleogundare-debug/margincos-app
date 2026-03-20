import { useState, useEffect, useRef } from 'react';

/* ── Social share URL builders ──────────────────────────────── */
function getSocialLinks(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      icon: <LinkedInIcon />,
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: <XIcon />,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: <FacebookIcon />,
    },
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${t}%20%E2%80%94%20${u}`,
      icon: <WhatsAppIcon />,
    },
  ];
}

/* ── Action bar SVG icons ───────────────────────────────────── */
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SaveIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const ChainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Social platform icons ──────────────────────────────────── */
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ── Main component ─────────────────────────────────────────── */
export default function ArticleActions({ title, slug }) {
  const [shareOpen,    setShareOpen]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [url,          setUrl]          = useState('');
  const shareRef = useRef(null);

  // Capture URL client-side (SSR-safe)
  useEffect(() => {
    setUrl(window.location.href.split('?')[0]);
  }, []);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShareOpen(false); }, 1800);
    } catch (_) {}
  };

  // Load html2pdf.js from CDN on first use, then generate a real PDF download
  const handleDownload = async () => {
    const el = document.getElementById('article-content');
    if (!el) return;
    setDownloading(true);
    try {
      // Dynamically load html2pdf bundle from CDN (only on click, not on page load)
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload  = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const filename = slug
        ? `${slug}.pdf`
        : `${(title || 'article').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.pdf`;
      await window.html2pdf()
        .set({
          margin:     [12, 14, 12, 14],
          filename,
          image:      { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:  { mode: ['avoid-all', 'css'] },
        })
        .from(el)
        .save();
    } catch (err) {
      console.error('[ArticleActions] PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const btnBase   = 'flex flex-col items-center gap-1.5 transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0';
  const labelBase = 'text-[9px] font-semibold tracking-widest uppercase';

  return (
    <div className="flex items-center gap-7">

      {/* ── Share dropdown ── */}
      <div ref={shareRef} className="relative">
        <button
          onClick={() => setShareOpen(o => !o)}
          aria-label="Share this article"
          aria-expanded={shareOpen}
          className={`${btnBase} ${shareOpen ? 'text-red-brand' : 'text-gray hover:text-red-brand'}`}
          style={{ color: shareOpen ? '#C0392B' : undefined }}
        >
          <ShareIcon />
          <span className={labelBase}>Share</span>
        </button>

        {shareOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 z-50 py-1"
            style={{ boxShadow: '0 4px 24px rgba(27,42,74,0.12)', borderRadius: 8 }}
            role="menu"
          >
            {getSocialLinks(url, title).map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                style={{ color: '#2A3A4A' }}
                role="menuitem"
              >
                <span style={{ color: '#8896A7' }}>{icon}</span>
                {name}
              </a>
            ))}

            <div className="border-t my-1" style={{ borderColor: '#E8ECF0' }} />

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors w-full text-left border-0 bg-transparent"
              style={{ color: '#2A3A4A' }}
              role="menuitem"
            >
              <span style={{ color: copied ? '#0D8F8F' : '#8896A7' }}>
                {copied ? <CheckIcon /> : <ChainIcon />}
              </span>
              {copied ? 'Link copied!' : 'Copy link'}
            </button>
          </div>
        )}
      </div>

      {/* ── Download (direct PDF file, no dialog) ── */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Download as PDF"
        className={`${btnBase} hover:text-red-brand`}
        style={{ color: downloading ? '#0D8F8F' : '#8896A7', opacity: downloading ? 0.7 : 1 }}
      >
        <DownloadIcon />
        <span className={labelBase}>{downloading ? 'Saving…' : 'Download'}</span>
      </button>

      {/* ── Save (bookmark toggle) ── */}
      <button
        onClick={() => setSaved(s => !s)}
        aria-label={saved ? 'Remove from saved' : 'Save this article'}
        className={btnBase}
        style={{ color: saved ? '#C0392B' : '#8896A7' }}
      >
        <SaveIcon filled={saved} />
        <span className={labelBase}>{saved ? 'Saved' : 'Save'}</span>
      </button>

    </div>
  );
}
