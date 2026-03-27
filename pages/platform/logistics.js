import SectorPage from '../../components/platform/SectorPage';

export default function LogisticsPage() {
  return (
    <SectorPage
      sectorName="Logistics & Distribution"
      sectorSlug="logistics"
      metaTitle="Margin Intelligence for Nigerian Logistics | MarginCOS"
      metaDescription="MarginCOS makes every margin leak visible across your logistics operations — lane rate gaps, fuel cost pass-through failures, customer margin erosion, and load profitability. In Naira. In minutes."
      heroHeadline="Margin Intelligence for Nigerian Logistics"
      heroSubheadline="Fleet operators and 3PLs managing lane profitability, fuel cost recovery, and customer margin. MarginCOS gives your CFO visibility on which lanes and contracts are loss-making — and exactly how much is recoverable in Naira."
      stat1={{ value: '63%', label: 'Diesel cost increase in 2024 alone' }}
      stat2={{ value: '40%', label: 'Of trucking cash outflows consumed by fuel' }}
      stat3={{ value: '<15%', label: 'Of operators have lane-level margin visibility' }}
      pillars={[
        {
          id: 'P1',
          name: 'Lane Rate Intelligence',
          problem: 'Most logistics operators have contracted rates set 12–24 months ago, before the diesel surge. They are running deliveries at a loss on specific lanes without knowing which ones — because nobody has calculated the fully-loaded cost per kilometre against the contracted rate.',
          delivers: [
            'Lane-level rate intelligence with fully-loaded cost per kilometre',
            'Rate deficit quantified in ₦/month per lane',
            'Cost floor breach alerts with rate renegotiation recommendations',
          ],
          roles: ['CFO', 'Commercial Director', 'Operations Director'],
        },
        {
          id: 'P2',
          name: 'Fuel Surcharge Recovery',
          problem: 'Diesel costs have surged 63% but most operators absorb the increase into margin rather than triggering contractual fuel surcharge conversations. The gap between what fuel costs and what the contracted rate covers compounds every month it goes unpriced.',
          delivers: [
            'Fuel cost pass-through rate vs. Carthena Advisory benchmark — 70–75% among commercially disciplined operators',
            'Per-lane fuel cost decomposition and recovery gap in ₦',
            'Fuel surcharge trigger recommendations by contract',
          ],
          roles: ['CFO', 'Finance Director', 'Fleet Manager'],
        },
        {
          id: 'P3',
          name: 'Customer Mix Analysis',
          problem: 'Revenue per customer looks healthy until dedicated capacity costs, empty return legs, loading time, and credit terms are deducted — revealing that some customer relationships are structurally loss-making regardless of rate.',
          delivers: [
            'Net margin by customer after fully-loaded service costs',
            'Customer profitability ranking by true contribution per lane',
            'Loss-making contract identification with renegotiation actions',
          ],
          roles: ['Commercial Director', 'Sales Director', 'Account Management'],
        },
        {
          id: 'P4',
          name: 'Load Profitability',
          problem: 'The decision to accept a load is often made on revenue alone. Some loads look good on topline but cost more to service than they earn after fuel, tolls, driver wages, and backhaul deadhead cost. Without per-load profitability visibility, loss-making loads are accepted repeatedly.',
          delivers: [
            'Per-load profitability — revenue, fully-loaded cost, and net margin',
            'Break-even utilisation calculation for every contract type',
            'Loss-making load identification with capacity reallocation recommendations',
          ],
          roles: ['Operations Director', 'Fleet Manager', 'CFO'],
        },
      ]}
      modules={[
        { id: 'M1', name: 'Route Rationalisation',         desc: 'Classify every lane into a defend / reprice / exit framework based on margin contribution vs. strategic volume importance.' },
        { id: 'M2', name: 'Fuel Price Scenario Engine',    desc: 'Model diesel price trajectories and stress-test your rate structure — see at what fuel price each lane becomes loss-making and what rate adjustment is needed.' },
        { id: 'M3', name: 'Contract Discount ROI',         desc: 'Calculate the return on every volume discount, dedicated fleet arrangement, and loyalty rate. Surface which terms generate margin and which destroy it.' },
        { id: 'M4', name: 'Customer Profitability Scorecard', desc: 'Rank every customer relationship by true net margin contribution after capacity, fuel, and credit costs. Identify who to reward, renegotiate, or exit.' },
      ]}
      ctaText="See what MarginCOS finds in your logistics operation"
      isLive={false}
    />
  );
}
