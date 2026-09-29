import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ComicPanel from '../components/ui/ComicPanel.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/auth/set-password', { token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.body?.error || 'This link is invalid or has expired. Request a new one.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <ComicPanel className="max-w-sm w-full flex flex-col gap-4">
          <p className="text-sm text-status-critical">This link is missing its token.</p>
          <Link to="/forgot-password" className="text-sm underline">
            Request a new link
          </Link>
        </ComicPanel>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ComicPanel className="max-w-sm w-full flex flex-col gap-4">
        <h1 className="font-heading text-2xl">Set your password</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Field
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <Button type="submit" disabled={submitting}>
            Set password
          </Button>
        </form>
      </ComicPanel>
    </main>
  );
}
