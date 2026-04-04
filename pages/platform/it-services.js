import SectorPage from '../../components/platform/SectorPage';

export default function ITServicesPage() {
  return (
    <SectorPage
      sectorName="IT Services"
      sectorSlug="it-services"
      metaTitle="IT Services Margin Recovery Software | MarginCOS"
      metaDescription="Margin recovery for IT service providers. Project profitability, resource utilisation, and client portfolio analysis. Coming soon."
      heroHeadline="Margin Intelligence for IT Services"
      heroSubheadline="Technology service providers managing contract margin, billing rates, and delivery cost recovery. MarginCOS gives your leadership visibility on which service lines and clients are loss-making — and exactly how much is recoverable."
      stat1={{ value: '90%+', label: 'Currency devaluation impact on USD-denominated licences' }}
      stat2={{ value: '<25%', label: 'Of IT firms have per-engagement margin visibility' }}
      stat3={{ value: '70%', label: 'Target gross margin for healthy managed services' }}
      pillars={[
        {
          id: 'P1',
          name: 'Service Rate Intelligence',
          problem: 'Most IT services firms have billing rates set before salary inflation and FX-driven licence cost increases compounded. They are delivering engagements below their cost-to-serve without knowing which service lines are worst — because nobody has calculated the fully-loaded cost per billable hour.',
          delivers: [
            'Service-line rate intelligence with fully-loaded cost-to-deliver benchmarks',
            'Rate deficit quantified per service line',
            'Cost floor breach alerts with billing rate adjustment recommendations',
          ],
          roles: ['CEO', 'CFO', 'Head of Delivery'],
          image: '/images/platform/it-services-p1.svg',
        },
        {
          id: 'P2',
          name: 'Cost Pass-Through',
          problem: 'Salary inflation and USD-denominated software licence costs have surged but billing rates haven\'t kept pace. The gap between delivery cost and contracted rate compounds every quarter it goes unpriced — eroding margin on engagements that appear profitable on revenue.',
          delivers: [
            'Cost pass-through rate vs. Carthena Advisory benchmark — 70–75% among commercially disciplined firms',
            'FX and salary cost decomposition by service line',
            'Contract escalation clause recommendations by engagement type',
          ],
          roles: ['CFO', 'Finance Director', 'Head of Commercial'],
          image: '/images/platform/it-services-p2.svg',
        },
        {
          id: 'P3',
          name: 'Client Mix Analysis',
          problem: 'Revenue per client looks healthy until account management overhead, support cost, scope creep hours, and payment terms are deducted — revealing that some client relationships cost more to serve than they generate in margin.',
          delivers: [
            'Net margin by client after fully-loaded delivery and support costs',
            'Client profitability ranking by true contribution per billable hour',
            'Loss-making engagement identification with rate adjustment actions',
          ],
          roles: ['CEO', 'Head of Sales', 'Account Directors'],
          image: '/images/platform/it-services-p3.svg',
        },
        {
          id: 'P4',
          name: 'Discount & Scope ROI',
          problem: 'Every proposal discount and scope addition erodes margin. Without per-engagement profitability visibility, discounts are offered to win work that is structurally unprofitable at the discounted rate — and scope creep is absorbed without commercial consequence.',
          delivers: [
            'Engagement profitability — contracted revenue, actual delivery cost, and net margin',
            'Break-even calculation for every proposal discount offered',
            'Scope creep quantification per engagement',
          ],
          roles: ['Head of Sales', 'Head of Delivery', 'CFO'],
          image: '/images/platform/it-services-p4.svg',
        },
      ]}
      modules={[
        { id: 'M1', name: 'Service Portfolio Rationalisation', desc: 'Classify every service line into a defend / reprice / exit framework based on margin contribution vs. strategic importance and client demand.' },
        { id: 'M2', name: 'Salary & FX Scenario Engine',       desc: 'Model salary inflation and FX trajectories — see at what FX rate each service line breaks its cost floor and what billing rate adjustment is needed.' },
        { id: 'M3', name: 'Proposal Discount ROI',              desc: 'Calculate the return on every proposal discount offered. Surface which wins generated margin and which were structurally unprofitable from day one.' },
        { id: 'M4', name: 'Client Profitability Scorecard',     desc: 'Rank every client relationship by true net margin contribution after delivery, support, and overhead costs. Identify who to grow, renegotiate, or exit.' },
      ]}
      ctaText="See what MarginCOS finds in your IT services portfolio"
      isLive={false}
    />
  );
}
