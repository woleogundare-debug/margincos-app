import SectorPage from '../../components/platform/SectorPage';

export default function FMCGPage() {
  return (
    <SectorPage
      sectorName="FMCG"
      sectorSlug="fmcg"
      metaTitle="Margin Intelligence for FMCG | MarginCOS"
      metaDescription="MarginCOS makes every margin leak visible across your FMCG portfolio — pricing gaps, cost pass-through failures, channel margin erosion, and trade investment waste. In your currency. In minutes."
      heroHeadline="Margin Intelligence for FMCG"
      heroSubheadline="Multi-product portfolios facing dual pressure from input cost inflation and price-sensitive consumers. MarginCOS gives your CFO and Commercial Director real-time visibility on which products are leaking margin — and exactly how much is recoverable."
      stat1={{ value: '40–60%', label: 'Input cost inflation absorbed since 2022' }}
      stat2={{ value: '16/19', label: 'Promotions loss-making in a typical portfolio' }}
      stat3={{ value: '15–30%', label: 'Recoverable margin uplift on a single product line' }}
      pillars={[
        {
          id: 'P1',
          name: 'Pricing Intelligence',
          problem: 'Most FMCG companies reprice reactively — without visibility on competitor positioning, margin floor breaches, or willingness-to-pay headroom. The result is chronic under-pricing that compounds every quarter.',
          delivers: [
            'Product-level pricing intelligence with competitor benchmarks in % and value terms',
            'WTP headroom quantified in recoverable revenue per month',
            'Margin floor breach alerts with repricing recommendations across your full portfolio',
          ],
          roles: ['CFO', 'Commercial Director'],
          image: '/images/platform/fmcg-p1.svg',
        },
        {
          id: 'P2',
          name: 'Cost Pass-Through',
          problem: 'Input cost inflation accumulates silently. Without cost pass-through analysis at the product level, absorbed costs compound into structural margin erosion — invisible on the P&L until recovery is no longer viable.',
          delivers: [
            'Cost pass-through rate vs. Carthena Advisory benchmark — 70–75% among commercially disciplined businesses',
            'FX-linked cost decomposition by product for inflation cost recovery planning',
            'Actual vs. self-reported inflation comparison',
          ],
          roles: ['CFO', 'Finance Director', 'Supply Chain'],
          image: '/images/platform/fmcg-p2.svg',
        },
        {
          id: 'P3',
          name: 'Channel Economics',
          problem: 'Gross margin looks healthy until logistics, partner margins, trade credit costs, and rebates are deducted by channel — revealing that some routes to market are actively destroying value while appearing profitable.',
          delivers: [
            'Net route-to-market margin by channel including trade credit cost',
            'Partner performance ranking by true contribution',
            'Weak channel identification with remediation actions',
          ],
          roles: ['Commercial Director', 'Sales Director', 'Trade Marketing'],
          image: '/images/platform/fmcg-p3.svg',
        },
        {
          id: 'P4',
          name: 'Trade Execution',
          problem: 'Commercial investment is the largest untracked cost line in most P&Ls. Without spend ROI visibility, promotional depth routinely exceeds margin — with no mechanism to catch it before the spend is committed.',
          delivers: [
            'Promotion profitability per product — revenue, cost, and net impact',
            'Break-even lift calculation for commercial spend ROI on every promotion',
            'Loss-making promotion flagging with margin-positive alternatives',
          ],
          roles: ['Trade Marketing', 'Sales Director', 'CFO'],
          image: '/images/platform/fmcg-p4.svg',
        },
      ]}
      modules={[
        { id: 'M1', name: 'Portfolio Rationalisation',         desc: 'Classify every product into a defend / reprice / delist framework based on margin contribution vs. strategic importance. Identify which products are margin-dilutive and where to rationalise for portfolio health.' },
        { id: 'M2', name: 'Forward Inflation Scenario Engine',  desc: 'Model cost trajectories under multiple inflation scenarios and stress-test your pricing strategy against each. See how margin erodes at 15%, 25%, or 40% input cost inflation — and what actions are needed to maintain floor margin.' },
        { id: 'M3', name: 'Commercial Spend ROI Analyser',      desc: 'Calculate the return on every unit of trade investment by channel and spend category. Surface which investments generate margin and which are destroying it — before the spend is committed.' },
        { id: 'M4', name: 'Partner Performance Scorecard',      desc: 'Rank every partner relationship by true net margin contribution after logistics, rebates, and credit costs. Identify who to reward, renegotiate, or exit.' },
      ]}
      ctaText="See what MarginCOS finds in your FMCG portfolio"
      isLive={true}
    />
  );
}
