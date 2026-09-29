import { FiAlertTriangle, FiCheckSquare, FiClock, FiBarChart2 } from 'react-icons/fi';

const rules = [
  {
    icon: FiCheckSquare,
    title: 'Maximum 4 Applications',
    description:
      'Each student may submit a maximum of 4 CCA applications. Choose wisely based on your interests and strengths.',
    color: 'var(--ch-red)',
  },
  {
    icon: FiAlertTriangle,
    title: 'Category Restrictions',
    description:
      'You may apply to either a Committee or an AIG (not both), plus up to 2 Clubs. Plan your applications accordingly.',
    color: 'var(--ch-gold)',
  },
  {
    icon: FiClock,
    title: 'Deadline Enforcement',
    description:
      'Each CCA has its own application deadline. Late applications will not be accepted. Check the deadlines on the Browse CCAs page.',
    color: 'var(--ch-sky)',
  },
  {
    icon: FiBarChart2,
    title: 'Ranking Importance',
    description:
      'After applying, rank your CCAs by preference on the Rankings page. Your ranking is a key input to the allocation algorithm. Rank 1 is your top choice.',
    color: 'var(--ch-grass)',
  },
];

const steps = [
  'Browse available CCAs and submit applications with required information.',
  'Committee heads review applications and may assign tasks.',
  'Rank your applied CCAs by preference on the Rankings page.',
  'The Council runs the allocation algorithm considering both your rankings and committee selections.',
  'View your allocation result on the Allocation page.',
];

export default function RulesPage() {
  return (
    <div className="page-container" style={{ maxWidth: '50rem' }}>
      <h1 className="mb-1" style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-red)', fontSize: '2.5rem' }}>
        CCA Selection Rules
      </h1>
      <p className="mb-8 font-semibold text-sm" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
        Please read these rules carefully before applying to CCAs.
      </p>

      {/* Rules as comic panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {rules.map((rule, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '2px solid var(--ch-ink)',
              boxShadow: '4px 4px 0 var(--ch-ink)',
              borderRadius: '4px',
              padding: '1.25rem',
              position: 'relative',
            }}
          >
            {/* Panel number badge */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '14px',
                background: rule.color,
                color: '#ffffff',
                border: '2px solid var(--ch-ink)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 900,
                fontFamily: "'Bangers', cursive",
              }}
            >
              {i + 1}
            </div>

            <div className="flex items-start space-x-3 mt-2">
              <div
                style={{
                  padding: '0.5rem',
                  background: 'var(--ch-paper)',
                  border: `2px solid ${rule.color}`,
                  borderRadius: '3px',
                  flexShrink: 0,
                }}
              >
                <rule.icon style={{ fontSize: '1.2rem', color: rule.color, width: '1.2rem', height: '1.2rem' }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: '1.15rem',
                    letterSpacing: '0.04em',
                    color: 'var(--ch-ink)',
                  }}
                >
                  {rule.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.7, lineHeight: 1.6 }}>
                  {rule.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Process overview — speech bubble style */}
      <div
        style={{
          background: '#fffdf5',
          border: '2px solid var(--ch-ink)',
          boxShadow: '4px 4px 0 var(--ch-ink)',
          borderRadius: '4px',
          padding: '1.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '1.5rem',
            color: 'var(--ch-gold)',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
          }}
        >
          Selection Process Overview
        </h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start space-x-3">
              <span
                style={{
                  flexShrink: 0,
                  width: '1.6rem',
                  height: '1.6rem',
                  background: 'var(--ch-gold)',
                  color: '#ffffff',
                  border: '2px solid var(--ch-ink)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  fontFamily: "'Bangers', cursive",
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--ch-ink)', lineHeight: 1.6 }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
