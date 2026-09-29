import ExcelExportButton from '../../components/ExcelExportButton';
import { FiFileText, FiTable } from 'react-icons/fi';

export default function ExportPage() {
  return (
    <div className="page-container" style={{ maxWidth: '44rem' }}>
      <h1 className="mb-6" style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-red)', fontSize: '2.25rem' }}>
        Export Data
      </h1>

      {/* Multi-sheet export */}
      <div className="comic-card mb-6">
        <div className="flex items-start space-x-4 mb-5">
          <div
            style={{
              padding: '0.65rem',
              background: 'var(--ch-paper)',
              border: '2px solid var(--ch-ink)',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          >
            <FiFileText style={{ fontSize: '1.5rem', color: 'var(--ch-red)', width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "'Bangers', cursive",
                fontSize: '1.3rem',
                color: 'var(--ch-ink)',
                letterSpacing: '0.04em',
              }}
            >
              Complete Export (Multi-Sheet)
            </h2>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
              Download a comprehensive Excel file with all CCA selection data.
            </p>
          </div>
        </div>

        <div
          className="rounded p-4 mb-5"
          style={{ background: 'var(--ch-paper)', border: '1.5px solid rgba(26,26,26,0.2)' }}
        >
          <p className="font-bold text-sm mb-3" style={{ color: 'var(--ch-ink)' }}>
            The export contains 3 sheets:
          </p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--ch-ink)' }}>
            {[
              ['All Applications', 'Every application with student details, committee, status, rankings, and answers.'],
              ['Allocation Results', 'Final allocation outcomes including student and committee preferences.'],
              ['Committee Summary', 'Per-committee statistics: application counts, selected, waitlisted, and rejected.'],
            ].map(([name, desc], i) => (
              <li key={i} className="flex items-start space-x-2">
                <span
                  style={{
                    flexShrink: 0,
                    width: '1.3rem',
                    height: '1.3rem',
                    background: 'var(--ch-red)',
                    color: '#ffffff',
                    border: '1.5px solid var(--ch-ink)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    fontFamily: "'Bangers', cursive",
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  <strong>{name}</strong> &mdash; {desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ExcelExportButton
          url="/council/export"
          filename="Calvin_CCA_Export.xlsx"
          label="Download Excel Export"
        />
      </div>

      {/* Flat Excel export */}
      <div className="comic-card">
        <div className="flex items-start space-x-4 mb-5">
          <div
            style={{
              padding: '0.65rem',
              background: 'var(--ch-paper)',
              border: '2px solid var(--ch-ink)',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          >
            <FiTable style={{ fontSize: '1.5rem', color: 'var(--ch-gold)', width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "'Bangers', cursive",
                fontSize: '1.3rem',
                color: 'var(--ch-ink)',
                letterSpacing: '0.04em',
              }}
            >
              Flat Excel Download
            </h2>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
              Single-sheet format — one row per application, ideal for analysis in Excel or Google Sheets.
            </p>
          </div>
        </div>

        <div
          className="rounded p-4 mb-5"
          style={{ background: 'var(--ch-paper)', border: '1.5px solid rgba(26,26,26,0.2)' }}
        >
          <p className="font-bold text-sm mb-2" style={{ color: 'var(--ch-ink)' }}>
            Each row includes:
          </p>
          <ul className="space-y-1 text-sm font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.7 }}>
            {[
              'Student Login ID, Name, Programme, Year',
              'Committee Name and Type',
              'Application Status',
              'Student Ranking and Committee Shortlist position',
              'All form answers (common + CCA-specific)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: 'var(--ch-gold)', flexShrink: 0 }}>&#9658;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ExcelExportButton
          url="/council/export/flat-excel"
          filename="Calvin_CCA_Flat_Export.xlsx"
          label="Download Flat Excel Export"
        />
      </div>
    </div>
  );
}
