/**
 * /api/exchange-rates
 *
 * Fetches USD → NGN / EUR / GBP spot rates from open.er-api.com
 * (free tier, no API key required).  Results are cached in-process
 * for 1 hour so the pricing page never stalls on a slow third-party
 * call.  On any fetch failure the route returns the hardcoded
 * fallback rates so the pricing page always renders something sensible.
 *
 * CDN cache header (s-maxage=3600) also lets Vercel edge cache the
 * response, meaning the upstream call happens at most once per hour
 * across all visitors.
 */

const FALLBACK_RATES = { NGN: 1650, EUR: 0.92, GBP: 0.79 };
const SOURCE_URL     = 'https://open.er-api.com/v6/latest/USD';
const CACHE_TTL_MS   = 60 * 60 * 1000; // 1 hour

// In-process cache — persists across requests in the same serverless
// instance.  Vercel warm instances reuse this, so the upstream API
// call is rare in practice.
let _cache    = null;
let _cacheTs  = 0;

export default async function handler(req, res) {
  // Allow GET only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Tell the CDN (Vercel Edge) to cache this for 1 hour, serve stale
  // for another hour while revalidating in the background.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  // Return in-process cache if still fresh
  if (_cache && Date.now() - _cacheTs < CACHE_TTL_MS) {
    return res.status(200).json(_cache);
  }

  try {
    const upstream = await fetch(SOURCE_URL, {
      headers: { 'Accept': 'application/json' },
      // Abort if the upstream takes more than 4 seconds
      signal: AbortSignal.timeout(4000),
    });

    if (!upstream.ok) {
      throw new Error(`Upstream ${upstream.status}`);
    }

    const data = await upstream.json();

    if (data.result !== 'success' || !data.rates) {
      throw new Error('Unexpected upstream payload');
    }

    _cache = {
      rates: {
        NGN: Math.round(data.rates.NGN * 100) / 100,
        EUR: Math.round(data.rates.EUR * 10000) / 10000,
        GBP: Math.round(data.rates.GBP * 10000) / 10000,
      },
      updatedAt: data.time_last_update_utc ?? new Date().toUTCString(),
      live: true,
    };
    _cacheTs = Date.now();

    return res.status(200).json(_cache);

  } catch (err) {
    console.error('[exchange-rates] fetch failed:', err.message);

    // Return fallback — never a 500 so the pricing page always works
    return res.status(200).json({
      rates:     FALLBACK_RATES,
      updatedAt: null,
      live:      false,
    });
  }
}
