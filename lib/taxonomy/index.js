import { FMCG_CATEGORIES, FMCG_DIVISIONS }               from './fmcg';
import { MANUFACTURING_CATEGORIES, MANUFACTURING_DIVISIONS } from './manufacturing';
import { RETAIL_CATEGORIES, RETAIL_DIVISIONS }             from './retail';
import {
  LOGISTICS_CATEGORIES, LOGISTICS_DIVISIONS,
  LOGISTICS_SEGMENTS, LOGISTICS_CHANNELS, LOGISTICS_REGIONS, LOGISTICS_TRUCK_TYPES,
} from './logistics';

export function getTaxonomy(vertical) {
  switch (vertical) {
    case 'FMCG':          return { categories: FMCG_CATEGORIES,          divisions: FMCG_DIVISIONS };
    case 'Manufacturing': return { categories: MANUFACTURING_CATEGORIES, divisions: MANUFACTURING_DIVISIONS };
    case 'Retail':        return { categories: RETAIL_CATEGORIES,        divisions: RETAIL_DIVISIONS };
    case 'Logistics':     return {
      categories: LOGISTICS_CATEGORIES,
      divisions:  LOGISTICS_DIVISIONS,
      segments:   LOGISTICS_SEGMENTS,
      channels:   LOGISTICS_CHANNELS,
      regions:    LOGISTICS_REGIONS,
      truckTypes: LOGISTICS_TRUCK_TYPES,
    };
    default:              return { categories: FMCG_CATEGORIES,          divisions: FMCG_DIVISIONS };
  }
}

export function getDivision(category, vertical) {
  const { divisions } = getTaxonomy(vertical);
  return divisions[category] || 'Uncategorised';
}
