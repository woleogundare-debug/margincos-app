/** @type {import('next').NextConfig} */

// Single source of truth for the Content-Security-Policy.
// This applies to all routes (SSR + SSG) via Next.js headers().
// netlify.toml and public/_headers mirror this value for static assets.
const CSP = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for styled-jsx.
  // 'unsafe-eval' is required by React-PDF (@react-pdf/renderer) which compiles WebAssembly at runtime.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // data: and blob: required for React-PDF: fonts are fetched as data URIs and the generated PDF
  // is handed to the browser as a blob URL to trigger the download.
  "connect-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://margincos.com https://www.margincos.com https://ipapi.co",
  "img-src 'self' data: blob: https:",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['xdlcglpqyrbknirdjgbg.supabase.co'],
  },
  async headers() {
    return [
      {
        // All routes — SSR, SSG, and API
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Set to 0: modern browsers use CSP instead; '1; mode=block' can introduce
          // vulnerabilities in older browsers and is deprecated in current security guidance.
          { key: 'X-XSS-Protection',          value: '0' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy',   value: CSP },
        ],
      },
      {
        // API routes — never cache; browsers and proxies must always revalidate
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // @react-pdf/renderer uses Node APIs that must not be bundled server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@react-pdf/renderer');
    }
    return config;
  },
};
module.exports = nextConfig;
