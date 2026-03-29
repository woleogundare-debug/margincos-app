import SectorPage from '../../components/platform/SectorPage';

export default function AviationPage() {
  return (
    <SectorPage
      sectorName="Aviation"
      sectorSlug="aviation"
      metaTitle="Margin Intelligence for Nigerian Aviation | MarginCOS"
      metaDescription="MarginCOS makes every margin leak visible across your aviation operations — route yield gaps, fuel cost pass-through failures, cabin mix erosion, and promotional fare ROI. In Naira. In minutes."
      heroHeadline="Margin Intelligence for Nigerian Aviation"
      heroSubheadline="Airlines and MRO providers managing route profitability, fuel cost pass-through, and yield optimisation. MarginCOS gives your leadership visibility on which routes and services are loss-making — and exactly how much is recoverable in Naira."
      stat1={{ value: '3.9%', label: 'Global airline net profit margin in 2026' }}
      stat2={{ value: '25.8%', label: 'Of operating costs consumed by jet fuel' }}
      stat3={{ value: '~3M', label: 'Nigerians returned to road travel since 2022' }}
      pillars={[
        {
          id: 'P1',
          name: 'Route Yield Intelligence',
          problem: 'Airlines set fare structures against demand models calibrated before fuel surges and FX devaluation reshaped cost structures. Individual routes have different cost-per-seat-kilometre profiles — and many are operating below their cost floor without anyone having calculated the break-even yield.',
          delivers: [
            'Route-level yield intelligence with fully-loaded cost per seat kilometre',
            'Yield deficit quantified in ₦/month per route',
            'Cost floor breach alerts with fare adjustment recommendations',
          ],
          roles: ['CFO', 'Chief Commercial Officer', 'Revenue Management'],
          image: '/images/platform/aviation-p1.svg',
        },
        {
          id: 'P2',
          name: 'Fuel Cost Pass-Through',
          problem: 'Jet fuel accounts for over a quarter of operating costs — higher in Nigeria given the FX premium on imported fuel and older fleet inefficiency. Fuel surcharges exist in theory but are rarely calibrated to the actual cost gap at the route level.',
          delivers: [
            'Fuel cost pass-through rate vs. Carthena Advisory benchmark',
            'Per-route fuel cost allocation and recovery gap in ₦',
            'Fuel surcharge calibration recommendations by route and cabin class',
          ],
          roles: ['CFO', 'Head of Revenue Management', 'Fleet Planning'],
          image: '/images/platform/aviation-p2.svg',
        },
        {
          id: 'P3',
          name: 'Route & Cabin Mix',
          problem: 'Business class, economy, domestic, and international segments have fundamentally different yield and cost profiles. Revenue growth on a domestic route can mask margin destruction when fully-loaded crew, fuel, and slot costs are allocated.',
          delivers: [
            'Net margin by route and cabin class after full cost allocation',
            'Route profitability ranking by true contribution per available seat',
            'Loss-making route identification with schedule optimisation actions',
          ],
          roles: ['Chief Commercial Officer', 'Head of Network Planning', 'CFO'],
          image: '/images/platform/aviation-p3.svg',
        },
        {
          id: 'P4',
          name: 'Promotional Fare ROI',
          problem: 'Flash sales, promotional fares, and codeshare arrangements are deployed to fill capacity — but without per-fare profitability analysis, discounted seats routinely cost more to service than they earn. Load factor improvements mean nothing if the incremental passengers are loss-making.',
          delivers: [
            'Per-fare class profitability — yield, fully-loaded cost, and net margin',
            'Break-even load factor calculation for every promotional fare',
            'Loss-making fare identification with yield-positive alternatives',
          ],
          roles: ['Revenue Management', 'Marketing Director', 'CFO'],
          image: '/images/platform/aviation-p4.svg',
        },
      ]}
      modules={[
        { id: 'M1', name: 'Route Rationalisation',     desc: 'Classify every route into a defend / reprice / suspend framework based on margin contribution vs. network strategic value and slot constraints.' },
        { id: 'M2', name: 'Fuel Price Scenario Engine', desc: 'Model jet fuel price trajectories — see at what price per litre each route breaks its margin floor and what fare adjustment is needed to maintain contribution.' },
        { id: 'M3', name: 'Promotional Fare ROI',       desc: 'Calculate the return on every fare promotion, flash sale, and codeshare rate. Surface which fill profitable capacity and which dilute yield below cost.' },
        { id: 'M4', name: 'Corporate Account Scorecard', desc: 'Rank every corporate travel account by true net margin contribution after dedicated fare rates, service costs, and rebates.' },
      ]}
      ctaText="See what MarginCOS finds in your aviation operation"
      isLive={false}
    />
  );
}
