import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ComicPanel from '../components/ui/ComicPanel.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';

function WagonDoodle() {
  return (
    <svg viewBox="0 0 160 120" width="140" height="105" aria-hidden="true">
      <rect x="30" y="40" width="90" height="45" rx="10" fill="var(--red)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="20" y="30" width="30" height="18" rx="4" fill="var(--mustard)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="50" cy="95" r="16" fill="var(--paper-light)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="100" cy="95" r="16" fill="var(--paper-light)" stroke="var(--ink)" strokeWidth="3" />
      <line x1="120" y1="55" x2="150" y2="30" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(loginId, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ComicPanel className="max-w-sm w-full flex flex-col items-center gap-6">
        <WagonDoodle />
        <h1 className="font-heading text-2xl">Calvin</h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field
            label="Login ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            Hop in
          </Button>
        </form>
        <Link to="/forgot-password" className="text-sm underline">
          Forgot your password?
        </Link>
      </ComicPanel>
    </main>
  );
}
