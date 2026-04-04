import SectorPage from '../../components/platform/SectorPage';

export default function TelecomsPage() {
  return (
    <SectorPage
      sectorName="Telecoms"
      sectorSlug="telecoms"
      metaTitle="Telecoms Margin Recovery Software | MarginCOS"
      metaDescription="Commercial intelligence for telecoms operators. Margin analysis across service lines, dealer economics, and subscriber profitability. Coming soon."
      heroHeadline="Margin Intelligence for Telecoms"
      heroSubheadline="Network operators managing product-level margin, energy cost recovery, and promotional bundle profitability. MarginCOS gives your leadership visibility on which products and bundles are leaking margin — and exactly how much is recoverable."
      stat1={{ value: '85%', label: 'Operating cost increase driven by energy in 2024' }}
      stat2={{ value: '35–40%', label: 'Operating cash outflows consumed by energy costs' }}
      stat3={{ value: '100', label: 'Maximum bundles allowed under NCC guidelines' }}
      pillars={[
        {
          id: 'P1',
          name: 'Product Rate Intelligence',
          problem: 'The NCC\'s tariff adjustment restored headline rates but not product-level margin. Individual data bundles, voice packages, and enterprise SLA tiers each have different cost-to-serve profiles — and many remain below their cost floor even after the rate increase.',
          delivers: [
            'Product-level rate intelligence with cost-to-serve benchmarks',
            'Rate deficit quantified per product and bundle',
            'Cost floor breach alerts with tariff adjustment recommendations per product',
          ],
          roles: ['CFO', 'Chief Commercial Officer', 'Head of Product'],
          image: '/images/platform/telecoms-p1.svg',
        },
        {
          id: 'P2',
          name: 'Energy Cost Recovery',
          problem: 'Energy costs consume a disproportionate share of operating expenditure. Diesel price surges flow through to tower costs, data centre costs, and network operations — but product pricing rarely adjusts at the same pace. The gap between energy cost and product revenue compounds every month.',
          delivers: [
            'Energy cost pass-through rate vs. Carthena Advisory benchmark — 70–75%',
            'Per-product energy cost allocation and recovery gap',
            'Cost-reflective pricing recommendations by product tier',
          ],
          roles: ['CFO', 'CTO', 'Head of Network Operations'],
          image: '/images/platform/telecoms-p2.svg',
        },
        {
          id: 'P3',
          name: 'Channel & Segment Mix',
          problem: 'Retail prepaid, postpaid, enterprise, and wholesale segments have fundamentally different cost-to-serve and margin profiles. Revenue growth in one segment can mask margin destruction in another — and acquisition costs vary dramatically by channel.',
          delivers: [
            'Net margin by segment after fully-loaded acquisition and service costs',
            'Channel profitability ranking by true margin contribution',
            'Loss-making segment identification with remediation actions',
          ],
          roles: ['Chief Commercial Officer', 'Head of Sales', 'Head of Enterprise'],
          image: '/images/platform/telecoms-p3.svg',
        },
        {
          id: 'P4',
          name: 'Bundle & Promotion ROI',
          problem: 'Bonus data offers, double data promotions, and loyalty rewards are deployed to drive retention and acquisition — but without per-bundle profitability analysis, promotional spend routinely exceeds the margin benefit. Under 100-bundle NCC limits, every bundle slot must earn its place.',
          delivers: [
            'Per-bundle profitability — subscriber revenue, cost-to-serve, and net margin',
            'Break-even subscriber calculation for every promotional bundle',
            'Loss-making bundle identification with margin-positive alternatives',
          ],
          roles: ['Head of Product', 'Marketing Director', 'CFO'],
          image: '/images/platform/telecoms-p4.svg',
        },
      ]}
      modules={[
        { id: 'M1', name: 'Product Portfolio Rationalisation', desc: 'Classify every product and bundle into a defend / reprice / retire framework based on margin contribution vs. subscriber strategic value.' },
        { id: 'M2', name: 'Energy Cost Scenario Engine',       desc: 'Model diesel and energy price trajectories — see at what cost per kWh each product tier breaks its margin floor and what pricing adjustment is needed.' },
        { id: 'M3', name: 'Promotional Bundle ROI',            desc: 'Calculate the return on every data bonus, loyalty reward, and promotional offer. Surface which retain margin value and which destroy it.' },
        { id: 'M4', name: 'Enterprise Customer Scorecard',     desc: 'Rank every corporate account by true net margin contribution after dedicated infrastructure, SLA costs, and support overhead.' },
      ]}
      ctaText="See what MarginCOS finds in your telecoms portfolio"
      isLive={false}
    />
  );
}
