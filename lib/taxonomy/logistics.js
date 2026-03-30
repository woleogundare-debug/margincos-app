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
  'Passengers',
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
  // Light commercial
  'Pickup / Van',
  'Hiace Bus',
  // Medium commercial
  'Coaster Bus',
  '10-Tonne',
  // Heavy freight
  '20-Tonne',
  '30-Tonne',
  '40-Tonne',
  'Trailer',
  'Flatbed',
  // Specialised
  'Tanker',
  'Refrigerated',
  // Passenger
  'Luxury Bus',
  'Sedan / SUV',
  'Mini Bus',
];

// getTaxonomy-compatible shape — categories drives the primary 'category' select
// channels drives the 'contract_type' select
// segments drives the 'cargo_type' select
export const LOGISTICS_DIVISIONS = Object.fromEntries(
  LOGISTICS_CATEGORIES.map(c => [c, 'Logistics'])
);
