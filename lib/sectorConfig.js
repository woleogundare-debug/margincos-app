// lib/sectorConfig.js
// Single source of truth for all sector-specific vocabulary.
// Every dashboard component reads labels from here.
// Adding a new sector = adding a new key to this object.

const SECTOR_CONFIGS = {
  FMCG: {
    // Unit terminology
    unit: 'SKU',
    unitPlural: 'SKUs',
    unitId: 'SKU ID',
    unitName: 'SKU',

    // Pillar display names
    p1: { name: 'Pricing Intelligence', short: 'Pricing · P1' },
    p2: { name: 'Cost Pass-Through', short: 'Cost · P2' },
    p3: { name: 'Channel Economics', short: 'Channel · P3' },
    p4: { name: 'Trade Execution', short: 'Trade · P4' },

    // Module display names
    m1: { name: 'Portfolio Rationalisation', short: 'M1' },
    m2: { name: 'Forward Scenario Engine', short: 'M2' },
    m3: { name: 'Commercial Spend ROI Analyser', short: 'M3' },
    m4: { name: 'Partner Performance Scorecard', short: 'M4' },

    // Field labels (used in tables, detail panels, exports)
    fields: {
      price: 'RRP',
      priceUnit: 'RRP (₦)',
      cost: 'COGS',
      costUnit: 'COGS/Unit (₦)',
      costPrior: 'COGS Prior Period (₦)',
      costInflation: 'COGS Inflation Rate (%)',
      volume: 'Monthly Volume',
      volumeUnit: 'Monthly Volume (Units)',
      channel: 'Primary Channel',
      partner: 'Distributor',
      partnerMargin: 'Distributor Margin (%)',
      partnerExposure: 'Distributor Exposure',
      promoDepth: 'Promo Depth (%)',
      promoLift: 'Promo Volume Lift (%)',
      elasticity: 'Price Elasticity',
      competitorPrice: 'Competitor Price',
      margin: 'Margin %',
      compGap: 'Comp. Gap',
      gainPerMonth: 'Gain ₦/mo',
      shock: 'Shock ₦/mo',
      passThrough: 'Pass-Through',
      absorbed: 'Absorbed ₦/mo',
      depth: 'Depth',
      lift: 'Lift',
      impact: 'Impact ₦/mo',
      status: 'Status',
      classification: 'Classification',
      action: 'Action',
      creditDays: 'Credit Days',
      creditCost: 'Credit Cost ₦',
    },

    // Tab label for portfolio page
    portfolioTab: 'SKU Portfolio',
    addButtonLabel: 'Add SKU',

    // Benchmark
    benchmark: {
      costRecoveryTarget: 75,
      costRecoveryLabel: 'Carthena Advisory benchmark — 70–75% among commercially disciplined Nigerian businesses',
      costRecoveryShort: '75%',
      minMarginFloor: 32,
      partnerMarginTip: 'Typically 8–15% for Nigerian FMCG.',
    },

    // Download template
    templateFile: '/downloads/MarginCOS_Data_Template_v3.2_FMCG.xlsx',
    templateFilename: 'MarginCOS_Data_Template_v3.2_FMCG.xlsx',

    // Narrative fragments used in callouts and PDF
    narrative: {
      emptyState: 'Add SKUs in Portfolio Manager to run your first margin analysis.',
      planLimit: (tier, limit) => `Your ${tier} plan supports up to ${limit} active SKUs. Upgrade to unlock more.`,
      periodHint: 'Each period represents a point-in-time snapshot of your portfolio. Create one to begin entering SKU data.',
      p1FloorBreach: (n) => `${n} SKU${n !== 1 ? 's' : ''} below margin floor`,
      p2EmptyState: 'Requires cost, inflation rate, and pass-through rate for each SKU.',
      p3EmptyState: 'Requires primary channel, partner margin, and monthly volume for each SKU.',
      p4EmptyState: 'Requires promo depth % and promo lift % on SKUs with promotional activity.',
      m4EmptyState: 'No partner data. Populate the partner name field on SKUs to unlock this module.',
      benchmarkNarrative: (pct) => {
        if (pct >= 75) return `Portfolio recovery rate of ${pct.toFixed(1)}% is at or above the Carthena Advisory benchmark of 70–75%.`;
        if (pct >= 60) return `Portfolio recovery rate of ${pct.toFixed(1)}% shows progress but remains below the Carthena Advisory benchmark of 70–75%.`;
        return `Portfolio recovery rate of ${pct.toFixed(1)}% represents a significant gap to the Carthena Advisory benchmark of 70–75%.`;
      },
    },

    // PDF report
    pdf: {
      introLine: (n) => `A pricing intelligence analysis across your active SKU portfolio of ${n} SKUs.`,
      summaryLine: (n) => `This report analyses ${n} active SKUs across all eight analytical engines.`,
      pillarSummary: 'Four pillars — pricing intelligence, cost pass-through, channel economics, and trade execution.',
      p1Section: 'P1 | Pricing Intelligence',
      p2Section: 'P2 | Cost Pass-Through',
      p3Section: 'P3 | Channel Economics',
      p3Subtitle: (distExp) => `Contribution margin by channel | Partner exposure: ${distExp}`,
      p4Section: 'P4 | Trade Execution',
      m1Section: 'M1 | Portfolio Rationalisation',
      m1Subtitle: (n, margin) => `${n} dilutive SKUs | Margin at stake: ${margin}`,
      m2Section: 'M2 | Forward Scenario Engine',
      m3Section: 'M3 | Commercial Spend ROI Analyser',
      m4Section: 'M4 | Partner Performance Scorecard',
      footerLine: (n, date) => `${n} active SKUs | Generated ${date}`,
    },

    // Excel export
    excel: {
      p1Sheet: 'P1 Pricing Intelligence',
      p2Sheet: 'P2 Cost Pass-Through',
      p3Sheet: 'P3 Channel Economics',
      p4Sheet: 'P4 Trade Execution',
      actionsSheet: 'Actions',
      portfolioSheet: 'Portfolio',
    },

    // Chart labels
    charts: {
      p1Title: 'Repricing Opportunity by SKU',
      p3Tooltip: 'SKUs:',
      p4Title: 'Promotion Net Impact by SKU',
      m1Subtitle: 'Revenue share vs margin % · Each dot = 1 SKU',
      m4Title: 'Partner Performance Matrix',
    },

    // Detail panel section headers
    detailSections: {
      p1: 'Pricing Intelligence (P1)',
      p2: 'Cost Pass-Through (P2)',
      p3: 'Channel Economics (P3)',
      p4: 'Trade Execution (P4)',
    },
  },

};

// ── Logistics — purpose-built config, not a spread of FMCG ──────────────────
SECTOR_CONFIGS.Logistics = {
  unit: 'Lane',
  unitPlural: 'Lanes',
  unitId: 'Lane ID',
  unitName: 'Lane',

  p1: { name: 'Lane Rate Intelligence', short: 'Rate · P1' },
  p2: { name: 'Fuel Cost Recovery', short: 'Cost · P2' },
  p3: { name: 'Customer Mix Analysis', short: 'Mix · P3' },
  p4: { name: 'Load Profitability', short: 'Load · P4' },

  m1: { name: 'Route Rationalisation', short: 'M1' },
  m2: { name: 'Fuel Price Scenario Engine', short: 'M2' },
  m3: { name: 'Contract Discount ROI Analyser', short: 'M3' },
  m4: { name: 'Customer Profitability Scorecard', short: 'M4' },

  fields: {
    price: 'Contracted Rate',
    priceUnit: 'Contracted Rate (₦)',
    cost: 'Fully-Loaded Cost',
    costUnit: 'Fully-Loaded Cost (₦)',
    costPrior: 'Prior Period Cost (₦)',
    costInflation: 'Cost Inflation (%)',
    volume: 'Monthly Trips',
    volumeUnit: 'Monthly Trips',
    channel: 'Contract Type',
    partner: 'Customer',
    partnerMargin: 'Customer Margin (%)',
    partnerExposure: 'Customer Exposure',
    promoDepth: 'Discount Depth (%)',
    promoLift: 'Volume Response (%)',
    elasticity: 'Rate Sensitivity',
    competitorPrice: 'Market Rate (₦)',
    margin: 'Margin %',
    compGap: 'vs. Market',
    gainPerMonth: 'Gain ₦/mo',
    shock: 'Cost Shock ₦/mo',
    passThrough: 'Rate Recovery',
    absorbed: 'Absorbed ₦/mo',
    depth: 'Discount',
    lift: 'Volume Response',
    impact: 'Impact ₦/mo',
    status: 'Status',
    classification: 'Classification',
    action: 'Action',
    creditDays: 'Payment Terms (Days)',
    creditCost: 'Credit Cost ₦',
  },

  portfolioTab: 'Lane Portfolio',
  addButtonLabel: 'Add Lane',

  benchmark: {
    costRecoveryTarget: 70,
    costRecoveryLabel: 'Carthena Advisory benchmark — 65–70% among commercially disciplined Nigerian logistics operators',
    costRecoveryShort: '70%',
    minMarginFloor: 20,
    partnerMarginTip: 'Typically 5–12% for Nigerian logistics.',
  },

  templateFile: '/downloads/MarginCOS_Data_Template_v3.2_Logistics.xlsx',
  templateFilename: 'MarginCOS_Data_Template_v3.2_Logistics.xlsx',

  narrative: {
    emptyState: 'Add lanes in Portfolio Manager to run your first margin analysis.',
    planLimit: (tier, limit) => `Your ${tier} plan supports up to ${limit} active lanes. Upgrade to unlock more.`,
    periodHint: 'Each period represents a point-in-time snapshot of your fleet operations. Create one to begin entering lane data.',
    p1FloorBreach: (n) => `${n} lane${n !== 1 ? 's' : ''} below margin floor`,
    p2EmptyState: 'Requires cost structure, inflation rate, and rate recovery for each lane.',
    p3EmptyState: 'Requires contract type, customer margin, and monthly trips for each lane.',
    p4EmptyState: 'Requires discount depth % and volume response % on lanes with discounting activity.',
    m4EmptyState: 'No customer data. Populate the customer name field on lanes to unlock this module.',
    benchmarkNarrative: (pct) => {
      if (pct >= 70) return `Fleet recovery rate of ${pct.toFixed(1)}% is at or above the Carthena Advisory benchmark of 65–70%.`;
      if (pct >= 55) return `Fleet recovery rate of ${pct.toFixed(1)}% shows progress but remains below the Carthena Advisory benchmark of 65–70%.`;
      return `Fleet recovery rate of ${pct.toFixed(1)}% represents a significant gap to the Carthena Advisory benchmark of 65–70%.`;
    },
  },

  pdf: {
    introLine: (n) => `A lane rate intelligence analysis across your active fleet portfolio of ${n} lanes.`,
    summaryLine: (n) => `This report analyses ${n} active lanes across all eight analytical engines.`,
    pillarSummary: 'Four pillars — lane rate intelligence, fuel cost recovery, customer mix analysis, and load profitability.',
    p1Section: 'P1 | Lane Rate Intelligence',
    p2Section: 'P2 | Fuel Cost Recovery',
    p3Section: 'P3 | Customer Mix Analysis',
    p3Subtitle: (custExp) => `Contribution margin by contract type | Customer exposure: ${custExp}`,
    p4Section: 'P4 | Load Profitability',
    m1Section: 'M1 | Route Rationalisation',
    m1Subtitle: (n, margin) => `${n} dilutive lanes | Margin at stake: ${margin}`,
    m2Section: 'M2 | Fuel Price Scenario Engine',
    m3Section: 'M3 | Contract Discount ROI Analyser',
    m4Section: 'M4 | Customer Profitability Scorecard',
    footerLine: (n, date) => `${n} active lanes | Generated ${date}`,
  },

  excel: {
    p1Sheet: 'P1 Lane Rate Intelligence',
    p2Sheet: 'P2 Fuel Cost Recovery',
    p3Sheet: 'P3 Customer Mix Analysis',
    p4Sheet: 'P4 Load Profitability',
    actionsSheet: 'Actions',
    portfolioSheet: 'Lane Portfolio',
  },

  charts: {
    p1Title: 'Rate Opportunity by Lane',
    p3Tooltip: 'Lanes:',
    p4Title: 'Load Profitability by Lane',
    m1Subtitle: 'Revenue share vs margin % · Each dot = 1 lane',
    m4Title: 'Customer Profitability Matrix',
  },

  detailSections: {
    p1: 'Lane Rate Intelligence (P1)',
    p2: 'Fuel Cost Recovery (P2)',
    p3: 'Customer Mix Analysis (P3)',
    p4: 'Load Profitability (P4)',
  },

  // Logistics-specific: data table name for engine routing
  dataTable: 'logistics_rows',

  // Field mapping: FMCG engine field name → logistics column name
  engineFieldMap: {
    sku_id: 'lane_id',
    sku_name: 'lane_name',
    category: 'route_region',
    segment: 'cargo_type',
    business_unit: 'fleet_division',
    rrp: 'contracted_rate_ngn',
    cogs_per_unit: 'fully_loaded_cost_ngn',
    price_elasticity: 'rate_sensitivity',
    proposed_price_change_pct: 'proposed_rate_change_pct',
    competitor_price: 'market_rate_ngn',
    target_margin_floor_pct: 'min_margin_floor_pct',
    wtp_premium_pct: 'rate_headroom_pct',
    monthly_volume_units: 'monthly_trips',
    primary_channel: 'contract_type',
    channel_revenue_split: null,
    distributor_name: 'customer_name',
    distributor_margin_pct: 'customer_margin_pct',
    trade_rebate_pct: 'rebate_pct',
    logistics_cost_per_unit: 'fuel_cost_per_km',
    credit_days: 'payment_terms_days',
    cogs_inflation_rate: 'cost_inflation_pct',
    pass_through_rate: 'pass_through_rate',
    fx_exposure_pct: 'fx_exposure_pct',
    cogs_prior_period: 'prior_period_cost_ngn',
    promo_depth_pct: 'discount_depth_pct',
    promo_lift_pct: 'volume_response_pct',
    region: 'operating_region',
    active: 'active',
  },
};

// Manufacturing and Retail share all FMCG vocabulary but get their own templates.
// Defined after SECTOR_CONFIGS closes so we can spread SECTOR_CONFIGS.FMCG.
SECTOR_CONFIGS.Manufacturing = {
  ...SECTOR_CONFIGS.FMCG,
  templateFile:     '/downloads/MarginCOS_Data_Template_v3.2_Manufacturing.xlsx',
  templateFilename: 'MarginCOS_Data_Template_v3.2_Manufacturing.xlsx',
};
SECTOR_CONFIGS.Retail = {
  ...SECTOR_CONFIGS.FMCG,
  templateFile:     '/downloads/MarginCOS_Data_Template_v3.2_Retail.xlsx',
  templateFilename: 'MarginCOS_Data_Template_v3.2_Retail.xlsx',
};

// Getter — returns the config for a given sector.
// Future sectors (Logistics, IT Services, etc.) will have their own full config entries.
export function getSectorConfig(sector) {
  if (!sector) return SECTOR_CONFIGS.FMCG;
  const key = sector.charAt(0).toUpperCase() + sector.slice(1);
  const config = SECTOR_CONFIGS[key];
  if (config) return config;
  // Unknown sector — safe fallback to FMCG
  return SECTOR_CONFIGS.FMCG;
}

// Pillar code to display name resolver — used by actions badge renderer
// This reads the SECTOR config and maps P1-M4 codes to display names
export function getPillarDisplayName(code, sector) {
  const cfg = getSectorConfig(sector);
  const map = {
    P1: cfg.p1.name,
    P2: cfg.p2.name,
    P3: cfg.p3.name,
    P4: cfg.p4.name,
    M1: cfg.m1.name,
    M2: cfg.m2.name,
    M3: cfg.m3.name,
    M4: cfg.m4.name,
  };
  return map[code] || code;
}

// Pillar code to short label resolver — used in table column headers
export function getPillarShortLabel(code, sector) {
  const cfg = getSectorConfig(sector);
  const map = {
    P1: cfg.p1.short,
    P2: cfg.p2.short,
    P3: cfg.p3.short,
    P4: cfg.p4.short,
    M1: cfg.m1.short,
    M2: cfg.m2.short,
    M3: cfg.m3.short,
    M4: cfg.m4.short,
  };
  return map[code] || code;
}

export default SECTOR_CONFIGS;
