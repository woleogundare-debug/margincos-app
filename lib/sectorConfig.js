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
