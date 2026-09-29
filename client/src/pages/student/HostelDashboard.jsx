import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';
import { FiHome, FiPlusCircle, FiInfo } from 'react-icons/fi';

export default function HostelDashboard() {
  const [hostelApps, setHostelApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/applications/my')
      .then((res) => {
        const all = Array.isArray(res.data) ? res.data : [];
        // Filter only hostel-type applications
        const hostel = all.filter(
          (a) => a.committee?.type === 'hostel' || a.committeeType === 'hostel'
        );
        setHostelApps(hostel);
      })
      .catch(() => toast.error('Failed to load hostel applications'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: '48rem' }}>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <FiHome style={{ fontSize: '2rem', color: 'var(--ch-red)' }} />
        <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: '2.5rem', color: 'var(--ch-red)' }}>
          Hostel Elections
        </h1>
      </div>
      <p className="mb-8 font-semibold text-sm" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
        File nominations for hostel council and warden positions.
      </p>

      {/* Info panel */}
      <div
        className="mb-6"
        style={{
          background: '#EEF6FF',
          border: '2px solid var(--ch-sky)',
          boxShadow: '3px 3px 0 var(--ch-ink)',
          borderRadius: '4px',
          padding: '1.25rem',
        }}
      >
        <div className="flex items-start gap-3">
          <FiInfo style={{ color: 'var(--ch-sky)', fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--ch-ink)' }}>
              Hostel nominations are separate from your CCA applications.
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.7 }}>
              You can apply to up to <strong>10 hostel positions</strong> without it affecting your CCA application limit of 4.
            </p>
          </div>
        </div>
      </div>

      {/* File nomination button */}
      <div className="mb-8">
        <button
          className="btn-calvin"
          style={{ fontSize: '1rem', padding: '0.6rem 1.5rem' }}
          onClick={() => navigate('/student/hostel/apply')}
        >
          <FiPlusCircle />
          <span>Browse Hostel Positions</span>
        </button>
      </div>

      {/* Existing hostel applications */}
      <div>
        <h2
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '1.5rem',
            color: 'var(--ch-ink)',
            marginBottom: '1rem',
          }}
        >
          My Hostel Nominations
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
              style={{ borderColor: 'var(--ch-red)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : hostelApps.length === 0 ? (
          <div
            className="comic-card text-center py-10"
          >
            <p className="font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.5 }}>
              You have not filed any hostel nominations yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hostelApps.map((app) => (
              <div
                key={app._id}
                className="comic-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex-1">
                  <h3 style={{ fontWeight: 800, color: 'var(--ch-ink)' }}>
                    {app.committee?.name || app.committeeName || 'Unknown Position'}
                  </h3>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.5 }}>
                    Nominated: {formatDate(app.createdAt || app.appliedAt)}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
