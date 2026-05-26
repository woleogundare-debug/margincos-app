import { setFormatterSym } from '../lib/formatters';
import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

const CURRENCIES = {
  USD: { sym: '$',    rate: 1      },
  NGN: { sym: '₦',   rate: 1620   },
  GBP: { sym: '£',   rate: 0.79   },
  EUR: { sym: '€',   rate: 0.92   },
  KES: { sym: 'KSh', rate: 129    },
  GHS: { sym: 'GH₵', rate: 15.4  },
  ZAR: { sym: 'R',   rate: 18.6  },
  EGP: { sym: 'E£',  rate: 48.5  },
  MAD: { sym: 'MAD', rate: 10.1  },
  TZS: { sym: 'TSh', rate: 2580  },
  AED: { sym: 'AED', rate: 3.67  },
  INR: { sym: '₹',   rate: 83.4  },
  SGD: { sym: 'S$',  rate: 1.35  },
  BRL: { sym: 'R$',  rate: 4.97  },
  MXN: { sym: 'MX$', rate: 17.2  },
  IDR: { sym: 'Rp',  rate: 15800 },
  PHP: { sym: '₱',   rate: 56.3  },
  ZMW: { sym: 'ZK',  rate: 26.8  },
  RWF: { sym: 'RF',  rate: 1340  },
  XOF: { sym: 'CFA', rate: 605   },
  ETB: { sym: 'Br',  rate: 113   },
  UGX: { sym: 'USh', rate: 3750  },
  MYR: { sym: 'RM',  rate: 4.72  },
  THB: { sym: '฿',   rate: 35.7  },
  TWD: { sym: 'NT$', rate: 32.1  },
  JPY: { sym: '¥',   rate: 149   },
  CNY: { sym: '¥',   rate: 7.24  },
  HKD: { sym: 'HK$', rate: 7.82  },
  AUD: { sym: 'A$',  rate: 1.53  },
  NZD: { sym: 'NZ$', rate: 1.63  },
  CAD: { sym: 'CA$', rate: 1.36  },
  CHF: { sym: 'CHF', rate: 0.91  },
  SAR: { sym: '﷼',   rate: 3.75  },
  QAR: { sym: 'QR',  rate: 3.64  },
  PKR: { sym: '₨',   rate: 278   },
  BDT: { sym: '৳',   rate: 110   },
  SEK: { sym: 'kr',  rate: 10.5  },
  NOK: { sym: 'kr',  rate: 10.6  },
  DKK: { sym: 'kr',  rate: 6.88  },
};

const CurrencyContext = createContext({
  currCode: 'NGN',
  currSym:  '₦',
  setCurrCode: () => {},
  fN:    (v) => '₦' + v,
  fNAbs: (v) => '₦' + v,
});

export function CurrencyProvider({ children }) {
  const [currCode, setCurrCodeState] = useState('NGN');
  const [currSym,  setCurrSym]       = useState('₦');
  const [teamId,   setTeamId]        = useState(null);

  // ── Operating currency is a team-level setting (teams.operating_currency),
  // resolved from Supabase on mount. No IP-based detection. Defaults to NGN
  // for any case where there is no session or the team row has not loaded yet
  // (e.g. public marketing pages, which carry their own separate currency state).
  useEffect(() => {
    let cancelled = false;
    const sb = getSupabaseClient();
    if (!sb) return;

    (async () => {
      try {
        const { data: { session } } = await sb.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return; // no session — stay on NGN default

        const { data: membership } = await sb
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .single();
        const tid = membership?.team_id;
        if (!tid) return;
        if (!cancelled) setTeamId(tid);

        const { data: teamRow } = await sb
          .from('teams')
          .select('operating_currency')
          .eq('id', tid)
          .single();

        const code = teamRow?.operating_currency || 'NGN';
        const cv   = CURRENCIES[code];
        if (cv && !cancelled) {
          setCurrCodeState(code);
          setCurrSym(cv.sym);
        }
      } catch (_) {
        // Network error or missing row — silently keep the NGN default
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Single source of truth: keep the module-level formatter symbol in
  // lib/formatters.js in lockstep with the React-context symbol. This fires on
  // every currCode change (initial load, team resolution, and admin selection),
  // eliminating the previous divergence where charts used context state while
  // dashboard KPIs and the PDF report used a separately-updated module symbol.
  useEffect(() => {
    setFormatterSym(currSym);
  }, [currSym, currCode]);

  // ── Admin currency selection. Persists to teams.operating_currency so the
  // choice survives a refresh, and updates context state immediately. RLS
  // (team_admin_can_update) gates the write to team admins; a non-admin write
  // is rejected by the database and the local state is rolled back.
  const setCurrCode = async (code) => {
    const cv = CURRENCIES[code];
    if (!cv) return { ok: false, error: 'Unsupported currency' };

    const prevCode = currCode;
    const prevSym  = currSym;

    // Optimistic update for immediate UI feedback
    setCurrCodeState(code);
    setCurrSym(cv.sym);

    if (!teamId) return { ok: true }; // no team context (e.g. marketing) — local only

    const sb = getSupabaseClient();
    if (!sb) return { ok: true };

    const { error } = await sb
      .from('teams')
      .update({ operating_currency: code })
      .eq('id', teamId);

    if (error) {
      // Roll back optimistic update on failure (e.g. RLS rejection)
      setCurrCodeState(prevCode);
      setCurrSym(prevSym);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const getSym = () => currSym || '₦';

  const fN = (v) => {
    if (v == null) return '';
    const abs  = Math.abs(v);
    const sign = v < 0 ? '-' : '+';
    const s    = getSym();
    if (abs >= 1e9) return sign + s + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + s + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + s + (abs / 1e3).toFixed(0) + 'K';
    return sign + s + abs.toFixed(0);
  };

  const fNAbs = (v) => {
    if (v == null) return '';
    const abs = Math.abs(v);
    const s   = getSym();
    if (abs >= 1e9) return s + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return s + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return s + (abs / 1e3).toFixed(0) + 'K';
    return s + abs.toFixed(0);
  };

  return (
    <CurrencyContext.Provider value={{ currCode, currSym, setCurrCode, fN, fNAbs }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export { CURRENCIES };
