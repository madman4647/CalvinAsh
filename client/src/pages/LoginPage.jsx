import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleBasePath } from '../utils/roleUtils';
import toast from 'react-hot-toast';
import { FiLogIn } from 'react-icons/fi';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    navigate(getRoleBasePath(user.role) + '/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      toast.error('Please enter both Login ID and Password');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(loginId.trim(), password);
      toast.success('Login successful!');
      navigate(getRoleBasePath(userData.role) + '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--ch-paper)' }}
    >
      {/* Decorative dots background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1A1A1A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Title block */}
        <div className="text-center mb-8">
          <h1
            className="text-8xl tracking-widest mb-1"
            style={{
              fontFamily: "'Bangers', cursive",
              color: 'var(--ch-red)',
              textShadow: '3px 3px 0 #1A1A1A',
            }}
          >
            CALVIN
          </h1>

          {/* Wavy underline */}
          <div className="flex justify-center mb-3">
            <svg width="220" height="10" viewBox="0 0 220 10" fill="none">
              <path
                d="M0 5 Q27.5 0 55 5 Q82.5 10 110 5 Q137.5 0 165 5 Q192.5 10 220 5"
                stroke="#CC2200"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>

          <p
            className="text-lg font-bold tracking-wider uppercase"
            style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-gold)', letterSpacing: '0.12em' }}
          >
            CCA Platform
          </p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
            Express your Interests...Online
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: '#ffffff',
            border: '2px solid #1A1A1A',
            boxShadow: '5px 5px 0 #1A1A1A',
            borderRadius: '4px',
            padding: '2rem',
          }}
        >
          <h2
            className="text-center mb-6"
            style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-ink)', fontSize: '1.75rem', letterSpacing: '0.05em' }}
          >
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="loginId" className="label">Login ID</label>
              <input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g., PGP40001"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-calvin w-full justify-center py-3 text-base"
            >
              {loading ? (
                <div
                  className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                />
              ) : (
                <>
                  <FiLogIn />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold hover:underline"
              style={{ color: 'var(--ch-sky)' }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <p
          className="text-center text-sm font-semibold mt-8"
          style={{ color: 'var(--ch-ink)', opacity: 0.55 }}
        >
          IIM Lucknow &middot; Team SynapsE
        </p>
      </div>
    </div>
  );
}
