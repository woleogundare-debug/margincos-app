export const VERTICALS = ['FMCG', 'Manufacturing', 'Retail'];

export const SEGMENTS = ['Mass Market', 'Mid-Range', 'Premium'];

export const PRIMARY_CHANNELS = [
  { code: 'MT', label: 'Modern Trade (MT)' },
  { code: 'OM', label: 'Open Market (OM)' },
  { code: 'WS', label: 'Wholesale (WS)' },
  { code: 'HO', label: 'HoReCa \u2013 Hotels, Restaurants & Catering (HO)' },
  { code: 'DI', label: 'Direct to Consumer (DI)' },
  { code: 'EC', label: 'E-Commerce (EC)' },
  { code: 'OT', label: 'Other (OT)' },
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

// Pillar and module access per tier
// pillars: URL segment names matching /dashboard/<segment>
// modules: whether Enterprise Modules are unlocked
// label: upgrade-prompt tier name (null = no upgrade needed)
export const TIER_ACCESS = {
  essentials: {
    pillars: ['pricing'],
    modules: false,
    label: 'Professional',
  },
  professional: {
    pillars: ['pricing', 'cost', 'channel', 'trade'],
    modules: false,
    label: 'Enterprise',
  },
  enterprise: {
    pillars: ['pricing', 'cost', 'channel', 'trade'],
    modules: true,
    label: null,
  },
};

// Seat and SKU caps per tier — null means unlimited
export const TIER_LIMITS = {
  essentials:   { maxMembers: 1,    maxSkus: 50 },
  professional: { maxMembers: 5,    maxSkus: 200 },
  enterprise:   { maxMembers: null, maxSkus: null },
};

// Nigerian working capital rate — used for credit days cost calculation
export const WORKING_CAPITAL_RATE = 0.28;

// Trade spend categories
export const TRADE_SPEND_CATEGORIES = [
  { key: 'listing_fees',       label: 'Shelf/Listing Fee',    tip: 'One-off or annual fee paid to a retailer or modern trade chain to stock your product on their shelves. Common in Shoprite, Spar, and supermarket chains.' },
  { key: 'coop_spend',         label: 'Trade Co-op',          tip: 'Shared marketing spend with a trade partner \u2014 e.g. funding their flyers, end-of-aisle displays, or in-store promotions that feature your brand.' },
  { key: 'activation_budget',  label: 'In-store Activation',  tip: 'Cost of in-store activities: product demos, sampling, merchandisers, and brand activations at point of sale.' },
  { key: 'gondola_payments',   label: 'Gondola & Display',    tip: 'Fees paid to secure premium shelf space \u2014 end-of-aisle gondola ends, checkout displays, or eye-level positioning in modern trade.' },
  { key: 'other_trade_spend',  label: 'Other Trade Spend',    tip: 'Any other trade investment not captured above \u2014 e.g. distributor incentive trips, sales force incentives, or channel-specific bonuses.' },
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

// Verticals not yet supported — shown as "coming soon" on the vertical selector
export const COMING_SOON_VERTICALS = ['Logistics', 'IT Services', 'Telecoms', 'Aviation', 'Healthcare', 'Financial Services'];
