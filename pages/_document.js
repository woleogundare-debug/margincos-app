import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
  return (
    <Html lang="en">
      <Head>
        {/* Preload self-hosted fonts */}
        <link rel="preload" href="/fonts/playfair-display-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dm-sans-500.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dm-sans-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1B2A4A" />
        {/* GA4 loaded dynamically by CookieConsent.js after user accepts */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
