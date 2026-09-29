import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ComicPanel from '../components/ui/ComicPanel.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function ForgotPasswordPage() {
  const [loginId, setLoginId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // N9: the response is the same generic message whether or not the ID
  // exists - the UI never has any way to tell the two cases apart either.
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', { loginId });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ComicPanel className="max-w-sm w-full flex flex-col gap-4">
        <h1 className="font-heading text-2xl">Forgot your password?</h1>
        {submitted ? (
          <Toast kind="info" message="If that login ID exists, we have sent a link to set a new password." />
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Field label="Login ID" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
            <Button type="submit" disabled={submitting}>
              Send set-password link
            </Button>
          </form>
        )}
        <Link to="/login" className="text-sm underline">
          Back to login
        </Link>
      </ComicPanel>
    </main>
  );
}
