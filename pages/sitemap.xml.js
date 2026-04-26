const SITE_URL = 'https://margincos.com';
const LASTMOD   = '2026-04-24';

const pages = [
  { url: '/',                                      priority: '1.0', changefreq: 'weekly'  },
  { url: '/platform',                              priority: '0.9', changefreq: 'monthly' },
  { url: '/platform/fmcg',                         priority: '0.8', changefreq: 'monthly' },
  { url: '/platform/manufacturing',                priority: '0.8', changefreq: 'monthly' },
  { url: '/platform/retail',                       priority: '0.8', changefreq: 'monthly' },
  { url: '/platform/logistics',                    priority: '0.8', changefreq: 'monthly' },
  { url: '/platform/telecoms',                     priority: '0.6', changefreq: 'monthly' },
  { url: '/platform/it-services',                  priority: '0.6', changefreq: 'monthly' },
  { url: '/platform/aviation',                     priority: '0.6', changefreq: 'monthly' },
  { url: '/pricing',                               priority: '0.9', changefreq: 'monthly' },
  { url: '/contact',                               priority: '0.8', changefreq: 'monthly' },
  { url: '/blog',                                  priority: '0.8', changefreq: 'weekly'  },
  { url: '/blog/fmcg-cost-pass-through-nigeria',   priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/rrp-floor-fmcg-nigeria',           priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/logistics-lane-profitability-nigeria',      priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/cost-pass-through-rate-calculation',        priority: '0.8', changefreq: 'monthly' },
  { url: '/blog/hidden-cost-trade-credit',                   priority: '0.8', changefreq: 'monthly' },
  { url: '/blog/fmcg-margin-leakage-signs',                  priority: '0.8', changefreq: 'monthly' },
  { url: '/privacy',                               priority: '0.3', changefreq: 'yearly'  },
  { url: '/terms',                                 priority: '0.3', changefreq: 'yearly'  },
];

function generateSiteMap(pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ url, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export default function SiteMap() {}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap(pages);
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
  return { props: {} };
}
