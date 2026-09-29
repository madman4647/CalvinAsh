import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDeadline, ccaTypeLabel, ccaTypeBadgeColor } from '../../utils/formatters';
import { FiSearch, FiExternalLink, FiEdit } from 'react-icons/fi';

export default function CCAListPage() {
  const [committees, setCommittees] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/committees'),
      api.get('/applications/my'),
    ])
      .then(([commRes, appRes]) => {
        const allComms = Array.isArray(commRes.data) ? commRes.data : commRes.data.committees || [];
        // Exclude hostel type from the regular CCA list
        setCommittees(allComms.filter((c) => c.type !== 'hostel'));
        setMyApps(Array.isArray(appRes.data) ? appRes.data : []);
      })
      .catch(() => toast.error('Failed to load CCAs'))
      .finally(() => setLoading(false));
  }, []);

  const appliedIds = new Set(myApps.map((a) => a.committeeId || a.committee?._id));
  const nonHostelApps = myApps.filter((a) => a.committee?.type !== 'hostel' && a.committeeType !== 'hostel');
  const maxReached = nonHostelApps.length >= 4;

  const filtered = committees.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

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
      <h1 className="mb-6" style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-red)' }}>
        Browse CCAs
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'committee', 'club', 'aig'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '3px',
                border: '2px solid var(--ch-ink)',
                cursor: 'pointer',
                boxShadow: filter === tab ? '2px 2px 0 var(--ch-ink)' : 'none',
                background: filter === tab ? 'var(--ch-red)' : '#ffffff',
                color: filter === tab ? '#ffffff' : 'var(--ch-ink)',
                transition: 'all 0.1s ease',
              }}
            >
              {tab === 'all' ? 'All' : ccaTypeLabel(tab) + 's'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <FiSearch
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ch-ink)', opacity: 0.5 }}
          />
          <input
            type="text"
            placeholder="Search CCAs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {maxReached && (
        <div
          className="mb-4 px-4 py-3 font-bold text-sm"
          style={{
            background: '#FFF3CD',
            border: '2px solid var(--ch-gold)',
            boxShadow: '2px 2px 0 var(--ch-ink)',
            borderRadius: '3px',
            color: 'var(--ch-ink)',
          }}
        >
          You have reached the maximum of 4 CCA applications.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.5 }}>
          No CCAs found.
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
                    className={`px-2 py-0.5 rounded text-xs font-bold ml-2 ${ccaTypeBadgeColor(c.type)}`}
                    style={{ border: '1.5px solid #1A1A1A', flexShrink: 0 }}
                  >
                    {ccaTypeLabel(c.type)}
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
                    <span>Presentation</span>
                  </a>
                )}
                <button
                  onClick={() => navigate(`/student/apply/${c._id}`)}
                  disabled={appliedIds.has(c._id) || maxReached || isDeadlinePassed(c.deadline)}
                  className="btn-calvin text-sm px-3 py-1.5"
                >
                  <FiEdit size={13} />
                  <span>
                    {appliedIds.has(c._id) ? 'Applied' : maxReached ? 'Max Reached' : 'Apply'}
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
