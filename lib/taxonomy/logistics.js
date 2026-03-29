// lib/taxonomy/logistics.js
// Reference lists for logistics vertical dropdowns

export const LOGISTICS_CATEGORIES = [
  'North-South Corridor',
  'East-West Corridor',
  'Lagos-North',
  'Lagos-East',
  'Lagos-West',
  'South-South',
  'South-East',
  'North-Central',
  'North-East',
  'North-West',
  'Cross-Country',
  'Intra-City',
  'Port Drayage',
  'Last Mile',
];

export const LOGISTICS_SEGMENTS = [
  'General Cargo',
  'Container (20ft)',
  'Container (40ft)',
  'Bulk / Loose',
  'Cold Chain',
  'Hazmat',
  'Project Cargo',
  'Flatbed',
];

export const LOGISTICS_CHANNELS = [
  'Spot',
  'Dedicated',
  'Contracted',
  'Ad-hoc',
  'Backhaul',
  'Inter-modal',
];

export const LOGISTICS_REGIONS = [
  'Lagos',
  'Abuja',
  'Kano',
  'Port Harcourt',
  'Ibadan',
  'Onitsha',
  'Owerri',
  'Enugu',
  'Benin City',
  'Kaduna',
  'Jos',
  'Maiduguri',
  'Warri',
  'Calabar',
  'Aba',
  'Other',
];

export const LOGISTICS_TRUCK_TYPES = [
  '10-Tonne',
  '20-Tonne',
  '30-Tonne',
  '40-Tonne',
  'Trailer',
  'Flatbed',
  'Tanker',
  'Refrigerated',
];

// getTaxonomy-compatible shape — categories drives the primary 'category' select
// channels drives the 'contract_type' select
// segments drives the 'cargo_type' select
export const LOGISTICS_DIVISIONS = Object.fromEntries(
  LOGISTICS_CATEGORIES.map(c => [c, 'Logistics'])
);
