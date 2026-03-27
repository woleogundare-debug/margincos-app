import SectorPage from '../../components/platform/SectorPage';

export default function RetailPage() {
  return (
    <SectorPage
      sectorName="Retail"
      sectorSlug="retail"
      metaTitle="Margin Intelligence for Nigerian Retail | MarginCOS"
      metaDescription="MarginCOS makes every margin leak visible across your retail portfolio — category pricing gaps, supplier cost pass-through failures, channel margin erosion, and promotional discount waste. In Naira. In minutes."
      heroHeadline="Margin Intelligence for Nigerian Retail"
      heroSubheadline="Multi-channel complexity where margin leaks silently through credit terms, supplier discount erosion, category mix, and promotional overspend. MarginCOS gives your CFO and Buying Director visibility on which categories are destroying value — and exactly how much is recoverable in Naira."
      stat1={{ value: '2–4%', label: 'Average retail net margin in Nigeria' }}
      stat2={{ value: '60%+', label: 'Of promotions run without a break-even calculation' }}
      stat3={{ value: '₦42M/mo', label: 'Recoverable margin through category repricing' }}
      pillars={[
        {
          id: 'P1',
          name: 'Category Pricing Intelligence',
          problem: 'Retail prices are set by category managers working from last season\'s data. Competitor price gaps, supplier cost changes, and margin floor breaches accumulate across hundreds of SKUs — and nobody has quantified the aggregate recovery opportunity until the annual review.',
          delivers: [
            'Category-level pricing intelligence with competitor benchmarks in ₦ and %',
            'Margin floor breach alerts across your full product range',
            'Repricing recommendations ranked by NGN margin contribution',
          ],
          roles: ['CFO', 'Category Manager', 'Buying Director'],
        },
        {
          id: 'P2',
          name: 'Supplier Cost Pass-Through',
          problem: 'Supplier price increases are frequent and compound. Without systematic cost pass-through analysis at the category level, retail businesses absorb inflation into margin rather than adjusting shelf prices — creating a structural gap that widens every quarter.',
          delivers: [
            'Cost pass-through rate vs. Carthena Advisory benchmark — 70–75% among commercially disciplined retailers',
            'Supplier cost increase decomposition by category',
            'Shelf price adjustment recommendations with consumer price sensitivity modelling',
          ],
          roles: ['CFO', 'Finance Director', 'Buying Director'],
        },
        {
          id: 'P3',
          name: 'Channel & Location Mix',
          problem: 'Physical, online, and wholesale channels have different margin profiles once fulfilment cost, payment terms, shrinkage, and overheads are allocated. Some channels look profitable on gross margin but destroy value at the net contribution level.',
          delivers: [
            'Net margin by channel after fully-loaded fulfilment, shrinkage, and overhead costs',
            'Location and format profitability ranking by true net contribution',
            'Loss-making channel and format identification with remediation actions',
          ],
          roles: ['CFO', 'Commercial Director', 'Operations Director'],
        },
        {
          id: 'P4',
          name: 'Promotional Discount ROI',
          problem: 'Promotional discounts, volume deals, and supplier-funded promotions are the largest untracked cost in retail P&Ls. Without per-promotion profitability analysis, discounts are approved on volume targets without calculating whether the margin trade-off is positive.',
          delivers: [
            'Promotion profitability per category — revenue, discount cost, and net margin impact',
            'Break-even volume uplift for every promotion before it runs',
            'Loss-making promotion identification with margin-positive restructuring recommendations',
          ],
          roles: ['Category Manager', 'Marketing Director', 'CFO'],
        },
      ]}
      modules={[
        { id: 'M1', name: 'Category Rationalisation',           desc: 'Classify every category and sub-category into a grow / maintain / exit framework based on margin contribution vs. footfall and strategic role.' },
        { id: 'M2', name: 'Forward Inflation Scenario Engine',   desc: 'Model supplier cost trajectories and stress-test your category pricing strategy. See how margin erodes at different inflation rates — and what shelf price adjustments are required.' },
        { id: 'M3', name: 'Commercial Spend ROI Analyser',       desc: 'Calculate the return on every ₦ of supplier co-investment, promotional funding, and markdown budget. Surface which promotions generate margin and which dilute it.' },
        { id: 'M4', name: 'Supplier Performance Scorecard',      desc: 'Rank every supplier relationship by true net margin contribution after rebates, terms, returns, and shrinkage. Identify which supplier relationships to grow, renegotiate, or exit.' },
      ]}
      ctaText="See what MarginCOS finds in your retail portfolio"
      isLive={true}
    />
  );
}
