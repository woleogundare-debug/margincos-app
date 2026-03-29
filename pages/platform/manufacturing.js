import SectorPage from '../../components/platform/SectorPage';

export default function ManufacturingPage() {
  return (
    <SectorPage
      sectorName="Manufacturing"
      sectorSlug="manufacturing"
      metaTitle="Margin Intelligence for Nigerian Manufacturing | MarginCOS"
      metaDescription="MarginCOS makes every margin leak visible across your manufacturing portfolio — product pricing gaps, input cost pass-through failures, distribution channel margin erosion, and commercial spend waste. In Naira. In minutes."
      heroHeadline="Margin Intelligence for Nigerian Manufacturing"
      heroSubheadline="Complex cost structures with multiple input lines, FX exposure, and multi-channel distribution. MarginCOS gives your CFO precision on which production lines are absorbing inflation that should be priced through — and exactly how much is recoverable in Naira."
      stat1={{ value: '40–60%', label: 'Input cost inflation absorbed since 2022' }}
      stat2={{ value: '<30%', label: 'Of manufacturers have product-level margin visibility' }}
      stat3={{ value: '₦85M/mo', label: 'Recoverable margin on a single product line' }}
      pillars={[
        {
          id: 'P1',
          name: 'Pricing Intelligence',
          problem: 'Most manufacturers in Nigeria set prices based on cost-plus calculations that haven\'t been updated since the inflationary cycle began. Competitor pricing has moved, consumer willingness-to-pay has shifted — but pricing remains static because nobody has quantified the gap.',
          delivers: [
            'Product-level pricing intelligence with competitor benchmarks in ₦ and %',
            'WTP headroom quantified in ₦/month of recoverable revenue per product line',
            'Margin floor breach alerts with repricing recommendations across your production portfolio',
          ],
          roles: ['CFO', 'Commercial Director'],
          image: '/images/platform/manufacturing-p1.svg',
        },
        {
          id: 'P2',
          name: 'Cost Pass-Through',
          problem: 'Manufacturing input cost inflation — raw materials, energy, packaging, FX-linked components — accumulates in layers. Without input-level cost pass-through analysis, absorbed costs compound into structural margin erosion invisible on the P&L until too late to recover.',
          delivers: [
            'Cost pass-through rate vs. Carthena Advisory benchmark — 70–75% among commercially disciplined businesses',
            'Input cost decomposition by product line — raw material, energy, packaging, and FX components separately',
            'Recovery gap quantified in ₦/month per production line',
          ],
          roles: ['CFO', 'Finance Director', 'Supply Chain'],
          image: '/images/platform/manufacturing-p2.svg',
        },
        {
          id: 'P3',
          name: 'Channel Economics',
          problem: 'Manufacturing businesses sell through multiple routes — direct, distributor, OEM, export. Gross margin at the factory gate looks very different once logistics, credit terms, returns, and partner margins are deducted by channel. Some routes are structurally loss-making.',
          delivers: [
            'Net margin by distribution channel after full route-to-market cost allocation',
            'Partner performance ranking by true net contribution',
            'Loss-making channel identification with remediation actions',
          ],
          roles: ['Commercial Director', 'Sales Director', 'Operations'],
          image: '/images/platform/manufacturing-p3.svg',
        },
        {
          id: 'P4',
          name: 'Commercial Spend ROI',
          problem: 'Trade discounts, volume rebates, and promotional allowances are commitments made before the margin impact is calculated. Without per-promotion profitability visibility, commercial spend routinely exceeds the margin benefit — and compounds across a large customer base.',
          delivers: [
            'Promotion profitability per product — revenue, cost, and net impact',
            'Break-even volume threshold for every discount and rebate commitment',
            'Loss-making commercial spend flagged with margin-positive alternatives',
          ],
          roles: ['Trade Marketing', 'Sales Director', 'CFO'],
          image: '/images/platform/manufacturing-p4.svg',
        },
      ]}
      modules={[
        { id: 'M1', name: 'Portfolio Rationalisation',         desc: 'Classify every production line into a defend / reprice / delist framework based on margin contribution vs. strategic importance. Remove margin-dilutive lines before they erode portfolio average.' },
        { id: 'M2', name: 'Forward Inflation Scenario Engine',  desc: 'Model raw material, energy, and FX cost trajectories under multiple inflation scenarios. See how portfolio margin erodes at each scenario — and what pricing actions are needed to maintain floor margin.' },
        { id: 'M3', name: 'Commercial Spend ROI Analyser',      desc: 'Calculate the return on every ₦ of trade investment by channel and spend category. Surface which volume discounts and promotional allowances generate margin and which destroy it.' },
        { id: 'M4', name: 'Partner Performance Scorecard',      desc: 'Rank every distributor and channel partner by true net margin contribution after logistics, rebates, and credit costs. Identify who to reward, renegotiate, or exit.' },
      ]}
      ctaText="See what MarginCOS finds in your manufacturing portfolio"
      isLive={true}
    />
  );
}
