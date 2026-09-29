import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiList, FiFileText, FiBarChart2, FiHelpCircle, FiCheckCircle, FiBookOpen, FiHome } from 'react-icons/fi';

const dashboardCards = [
  { to: '/student/ccas', icon: FiList, title: 'Browse CCAs', desc: 'View available committees, clubs, and AIGs' },
  { to: '/student/applications', icon: FiFileText, title: 'My Applications', desc: 'View and manage your submitted applications' },
  { to: '/student/hostel', icon: FiHome, title: 'Hostel Elections', desc: 'File nominations for hostel positions' },
  { to: '/student/rankings', icon: FiBarChart2, title: 'Rankings', desc: 'Rank your applied CCAs by preference' },
  { to: '/student/common-questions', icon: FiHelpCircle, title: 'Common Questions', desc: 'Answer standard questions and upload resume' },
  { to: '/student/allocation', icon: FiCheckCircle, title: 'Allocation Results', desc: 'View your CCA allocation outcome' },
  { to: '/student/rules', icon: FiBookOpen, title: 'Rules', desc: 'Read the CCA selection rules and guidelines' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [appCount, setAppCount] = useState(0);
  const [maxApplications, setMaxApplications] = useState(4);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/applications/my').catch(() => ({ data: [] })),
      api.get('/admin/settings').catch(() => ({ data: null })),
    ]).then(([appRes, settingsRes]) => {
      setAppCount(Array.isArray(appRes.data) ? appRes.data.length : 0);
      if (settingsRes.data?.max_applications) {
        setMaxApplications(settingsRes.data.max_applications);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: '2.5rem', color: 'var(--ch-red)' }}>
          Welcome, {user?.name || user?.loginId}!
        </h1>
        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
          Co-Curricular Activity Selection Portal
        </p>

        {!loading && (
          <div
            className="mt-4 inline-flex items-center px-4 py-2"
            style={{
              background: '#ffffff',
              border: '2px solid var(--ch-ink)',
              boxShadow: '3px 3px 0 var(--ch-ink)',
              borderRadius: '3px',
            }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--ch-ink)' }}>
              Applications submitted:{' '}
              <span style={{ color: appCount >= maxApplications ? 'var(--ch-red)' : 'var(--ch-grass)' }}>
                {appCount}
              </span>{' '}
              / {maxApplications}
            </span>
          </div>
        )}
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="comic-card group"
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <div className="flex items-start space-x-4">
                <div
                  style={{
                    padding: '0.65rem',
                    background: 'var(--ch-paper)',
                    border: '2px solid var(--ch-ink)',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                >
                  <card.icon
                    style={{ fontSize: '1.5rem', color: 'var(--ch-red)', width: '1.5rem', height: '1.5rem' }}
                  />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--ch-ink)', fontSize: '1.05rem' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
                    {card.desc}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
