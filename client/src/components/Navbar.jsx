import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

const navLinks = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/student/ccas', label: 'Browse CCAs' },
    { to: '/student/hostel', label: 'Hostel' },
    { to: '/student/applications', label: 'My Applications' },
    { to: '/student/rankings', label: 'Rankings' },
    { to: '/student/common-questions', label: 'Common Questions' },
    { to: '/student/allocation', label: 'Allocation' },
    { to: '/student/rules', label: 'Rules' },
  ],
  committee: [
    { to: '/committee/dashboard', label: 'Dashboard' },
    { to: '/committee/form', label: 'Edit Form' },
    { to: '/committee/applications', label: 'Applications' },
  ],
  council: [
    { to: '/council/dashboard', label: 'Dashboard' },
    { to: '/council/committees', label: 'Committees' },
    { to: '/council/applications', label: 'All Applications' },
    { to: '/council/allocate', label: 'Allocation' },
    { to: '/council/export', label: 'Export' },
    { to: '/council/common-questions', label: 'Common Questions' },
    { to: '/council/bulk-mail', label: 'Bulk Mail' },
    { to: '/council/settings', label: 'Settings' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = navLinks[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <nav
      style={{
        backgroundColor: 'var(--ch-red)',
        borderBottom: '3px solid var(--ch-ink)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 3px 0 #1A1A1A',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            to={`/${user.role}/dashboard`}
            className="flex items-center space-x-2 no-underline"
          >
            <span
              style={{
                fontFamily: "'Bangers', cursive",
                fontSize: '1.75rem',
                letterSpacing: '0.1em',
                color: '#ffffff',
                textShadow: '2px 2px 0 #1A1A1A',
              }}
            >
              CALVIN
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--ch-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'none',
              }}
              className="sm:!inline"
            >
              CCA Platform
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '2px',
                  color: isActive(link.to) ? 'var(--ch-ink)' : '#ffffff',
                  backgroundColor: isActive(link.to) ? 'var(--ch-gold)' : 'transparent',
                  border: isActive(link.to) ? '2px solid var(--ch-ink)' : '2px solid transparent',
                  boxShadow: isActive(link.to) ? '2px 2px 0 var(--ch-ink)' : 'none',
                  textDecoration: 'none',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.to)) {
                    e.target.style.color = 'var(--ch-gold)';
                    e.target.style.textDecoration = 'underline';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.to)) {
                    e.target.style.color = '#ffffff';
                    e.target.style.textDecoration = 'none';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User info + logout (desktop) */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <FiUser style={{ color: 'var(--ch-gold)' }} />
              <span className="font-semibold">{user.name || user.loginId}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'transparent',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '2px',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--ch-gold)';
                e.currentTarget.style.color = 'var(--ch-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden"
            style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: '#A81C00',
            borderTop: '2px solid var(--ch-ink)',
          }}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: '2px',
                  color: isActive(link.to) ? 'var(--ch-ink)' : '#ffffff',
                  backgroundColor: isActive(link.to) ? 'var(--ch-gold)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <div className="flex items-center space-x-2 text-sm px-3 py-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <FiUser style={{ color: 'var(--ch-gold)' }} />
                <span className="font-semibold">{user.name || user.loginId}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm px-3 py-2 w-full"
                style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
