import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDeadline } from '../../utils/formatters';
import { FiSearch, FiEdit, FiExternalLink, FiInfo } from 'react-icons/fi';

export default function HostelApplyPage() {
  const [hostelCCAs, setHostelCCAs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      // Try the dedicated hostel endpoint first, fall back to filtering /committees
      api.get('/student/hostel/ccas')
        .catch(() => api.get('/committees').then((r) => {
          const all = Array.isArray(r.data) ? r.data : r.data.committees || [];
          return { data: all.filter((c) => c.type === 'hostel') };
        })),
      api.get('/applications/my'),
    ])
      .then(([commRes, appRes]) => {
        setHostelCCAs(Array.isArray(commRes.data) ? commRes.data : []);
        setMyApps(Array.isArray(appRes.data) ? appRes.data : []);
      })
      .catch(() => toast.error('Failed to load hostel positions'))
      .finally(() => setLoading(false));
  }, []);

  const appliedIds = new Set(myApps.map((a) => a.committeeId || a.committee?._id));
  const hostelApps = myApps.filter(
    (a) => a.committee?.type === 'hostel' || a.committeeType === 'hostel'
  );
  const maxHostelReached = hostelApps.length >= 10;

  const isDeadlinePassed = (deadline) => deadline && new Date(deadline) < new Date();

  const filtered = hostelCCAs.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: 'var(--ch-red)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-red)', fontSize: '2.25rem' }} className="mb-2">
        Hostel Elections
      </h1>
      <p className="text-sm font-semibold mb-6" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
        File your nomination for a hostel council or warden position below.
      </p>

      {/* Process banner */}
      <div
        className="mb-6 px-4 py-3"
        style={{
          background: '#EEF6FF',
          border: '2px solid var(--ch-sky)',
          boxShadow: '3px 3px 0 var(--ch-ink)',
          borderRadius: '4px',
        }}
      >
        <div className="flex items-start gap-2">
          <FiInfo style={{ color: 'var(--ch-sky)', flexShrink: 0, marginTop: '2px' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ch-ink)' }}>
            Hostel nominations are processed separately from CCA applications. You may apply to up to{' '}
            <strong>10 hostel positions</strong>. Submitting here does not affect your CCA application count.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <FiSearch
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ch-ink)', opacity: 0.45 }}
        />
        <input
          type="text"
          placeholder="Search positions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {maxHostelReached && (
        <div
          className="mb-4 px-4 py-3 font-bold text-sm"
          style={{
            background: '#FFF3CD',
            border: '2px solid var(--ch-gold)',
            boxShadow: '2px 2px 0 var(--ch-ink)',
            borderRadius: '3px',
          }}
        >
          You have reached the maximum of 10 hostel nominations.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.5 }}>
          No hostel positions available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="comic-card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 style={{ fontWeight: 800, color: 'var(--ch-ink)', fontSize: '1rem', flex: 1 }}>
                    {c.name}
                  </h3>
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'var(--ch-sky)',
                      color: '#ffffff',
                      border: '1.5px solid var(--ch-ink)',
                      borderRadius: '3px',
                      flexShrink: 0,
                      marginLeft: '0.5rem',
                    }}
                  >
                    Hostel
                  </span>
                </div>
                <p className="text-xs font-semibold mb-4" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
                  {formatDeadline(c.deadline)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {c.presentationUrl && (
                  <a
                    href={c.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-calvin-outline text-sm px-3 py-1.5"
                    style={{ textDecoration: 'none' }}
                  >
                    <FiExternalLink size={13} />
                    <span>Info</span>
                  </a>
                )}
                <button
                  onClick={() => navigate(`/student/apply/${c._id}`)}
                  disabled={appliedIds.has(c._id) || maxHostelReached || isDeadlinePassed(c.deadline)}
                  className="btn-calvin text-sm px-3 py-1.5"
                >
                  <FiEdit size={13} />
                  <span>
                    {appliedIds.has(c._id) ? 'Nominated' : maxHostelReached ? 'Max Reached' : 'Nominate'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
