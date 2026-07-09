// Reference stressed synthetic fixture generator for M1/M4 (and future chart) validation.
// The staging seed fixture is analytically degenerate (uniform ~41% margins, no Reprice,
// no distributor destruction). Run: node scripts/generate_stressed_fixture.mjs
// See PLATFORM.TEST_FIXTURES.REALISTIC_DISPERSION.
// Deterministic stressed synthetic fixture for M1/M4 redesign validation.
// Targets: 60 SKUs, margin dispersion ~14-50%, Pareto revenue concentration,
// all four M1 classes incl Reprice, 12 distributors with 3 toxic (negative
// contribution), 2 cost-plus SKUs. Does NOT touch the staging DB.
import { writeFileSync } from 'fs';

let seed = 20260708;
const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const rint = (lo, hi) => Math.round(lo + rng() * (hi - lo));
const rnum = (lo, hi) => lo + rng() * (hi - lo);

const NORMAL = ['Unilever Nigeria','Nestle Nigeria','PZ Wilmar','Promasidor Nigeria','Multipro Consumer Products','Honeywell Flour Mills','De United Foods','Chi Limited','Dangote Direct'];
const TOXIC  = ['Sahel Distributors','Coastline Trading','Riverside Wholesale'];
const CATS   = ['Beverages','Dairy','Personal Care','Household Care','Cooking Oils','Staples & Grains','Instant Noodles','Baby Care'];

// segment plan: 15 premium (hi margin), 20 mass (mid), 25 value (low)
const plan = [];
for (let i=0;i<15;i++) plan.push({seg:'premium', mLo:0.42,mHi:0.50, pLo:2500,pHi:9000});
for (let i=0;i<20;i++) plan.push({seg:'mass',    mLo:0.25,mHi:0.33, pLo:600, pHi:3000});
for (let i=0;i<25;i++) plan.push({seg:'value',   mLo:0.13,mHi:0.20, pLo:150, pHi:1200});

// heroes (high volume -> high revenue share):
const premiumHero = new Set([0,2,4,6,8]);        // premium + high volume  -> Protect
const repriceHero = new Set([15,16,17,18]);      // below-avg margin at high price + high volume -> Reprice
// toxic SKUs: assign a cluster of value SKUs to the 3 toxic distributors
const toxicAssign = { 41:0,43:0,45:0, 47:1,49:1,51:1, 53:2,55:2,57:2 };  // sku index -> toxic distributor index

const rows = [];
plan.forEach((p, i) => {
  const isReneg = (i === 19 || i === 21);       // high revenue share, low-but-positive contribution -> Renegotiate (amber)
  let margin, rrp, vol;
  if (repriceHero.has(i)) {                     // low margin at a high price point, high volume
    margin = rnum(0.20, 0.25); rrp = rint(2200, 3600); vol = rint(430000, 580000);
  } else if (isReneg) {
    margin = rnum(0.26, 0.29); rrp = rint(2300, 2900); vol = rint(470000, 560000);
  } else {
    margin = rnum(p.mLo, p.mHi); rrp = rint(p.pLo, p.pHi);
    vol = premiumHero.has(i) ? rint(320000, 520000) : rint(8000, 95000);
  }
  const cogs = Math.round(rrp * (1 - margin));
  const isToxic = i in toxicAssign;
  const dist = isReneg ? 'Volume Traders Ltd' : (isToxic ? TOXIC[toxicAssign[i]] : NORMAL[i % NORMAL.length]);
  const distM = isReneg ? 0.16 : (isToxic ? rnum(0.20, 0.26) : rnum(0.06, 0.15));
  const rebate = isReneg ? 0.04 : (isToxic ? rnum(0.05, 0.08) : rnum(0.015, 0.03));
  const logCost = Math.round(rrp * (isToxic ? rnum(0.03,0.05) : rnum(0.01,0.025)));
  const credit = isReneg ? 45 : (isToxic ? rint(60, 90) : rint(14, 45));
  const row = {
    sku_id: 'SS-' + String(i+1).padStart(3,'0'),
    sku_name: `${p.seg[0].toUpperCase()+p.seg.slice(1)} ${CATS[i%CATS.length]} ${['200g','400g','1L','500ml','2kg','75ml','5L','360g'][i%8]}`,
    category: CATS[i % CATS.length],
    rrp, cogs_per_unit: cogs, monthly_volume_units: vol,
    distributor_name: dist,
    distributor_margin_pct: +distM.toFixed(3),
    trade_rebate_pct: +rebate.toFixed(3),
    logistics_cost_per_unit: logCost,
    credit_days: credit,
  };
  if (i === 3 || i === 20) row.pass_through_rate = 1.2;   // cost-plus rows (for reuse; not used by M1/M4)
  rows.push(row);
});

writeFileSync(new URL('./stressed_fixture.json', import.meta.url), JSON.stringify(rows, null, 0));

// quick diagnostics
const margins = rows.map(r => (r.rrp - r.cogs_per_unit)/r.rrp*100);
const mean = margins.reduce((s,v)=>s+v,0)/margins.length;
const sd = Math.sqrt(margins.reduce((s,v)=>s+(v-mean)**2,0)/margins.length);
const revs = rows.map(r => r.rrp*r.monthly_volume_units).sort((a,b)=>b-a);
const tot = revs.reduce((s,v)=>s+v,0);
const top5 = revs.slice(0,5).reduce((s,v)=>s+v,0)/tot*100;
const top20 = revs.slice(0,20).reduce((s,v)=>s+v,0)/tot*100;
console.log(`Generated ${rows.length} SKUs | margin min ${Math.min(...margins).toFixed(1)}% max ${Math.max(...margins).toFixed(1)}% mean ${mean.toFixed(1)}% stddev ${sd.toFixed(1)}pp`);
console.log(`Revenue concentration: top5 ${top5.toFixed(0)}% | top20 ${top20.toFixed(0)}% | distributors ${new Set(rows.map(r=>r.distributor_name)).size} (toxic: ${TOXIC.join(', ')})`);
