export const VERTICALS = ['FMCG', 'Manufacturing', 'Retail'];

export const SEGMENTS = ['Mass Market', 'Mid-Range', 'Premium'];

export const PRIMARY_CHANNELS = [
  { code: 'MT', label: 'Modern Trade' },
  { code: 'OM', label: 'Open Market' },
  { code: 'WS', label: 'Wholesale' },
  { code: 'HO', label: 'HoReCa' },
  { code: 'DI', label: 'Direct' },
  { code: 'EC', label: 'E-Commerce' },
  { code: 'OT', label: 'Other' },
];

export const REGIONS = [
  'North Central', 'North East', 'North West',
  'South East', 'South South', 'South West',
  'FCT Abuja', 'Lagos', 'National',
];

export const TIERS = {
  ESSENTIALS:    'essentials',
  PROFESSIONAL:  'professional',
  ENTERPRISE:    'enterprise',
};

// Nigerian working capital rate — used for credit days cost calculation
export const WORKING_CAPITAL_RATE = 0.28;

// Trade spend categories
export const TRADE_SPEND_CATEGORIES = [
  { key: 'listing_fees',       label: 'Listing Fees' },
  { key: 'coop_spend',         label: 'Co-op Spend' },
  { key: 'activation_budget',  label: 'Activation' },
  { key: 'gondola_payments',   label: 'Gondola' },
  { key: 'other_trade_spend',  label: 'Other' },
];

// Demo gate — free email provider list
export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'aol.com','mail.com','protonmail.com','ymail.com','live.com',
]);

// Admin bypass credentials
export const DEMO_BYPASS = {
  name:  'Wole Ogundare',
  email: 'demo@margincos.com',
};

// BUA Foods benchmark — used in P2 callout
export const BUA_BENCHMARK_PCT = 75;
