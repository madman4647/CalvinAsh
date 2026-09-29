import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function BulkMailPage() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { sent, failed }
  const [confirmed, setConfirmed] = useState(false);

  const handleSend = async () => {
    if (!confirmed) {
      toast.error('Please confirm before sending');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await api.post('/council/bulk-mail-credentials');
      const data = res.data || {};
      setResult({
        sent: data.sent ?? data.success ?? 0,
        failed: data.failed ?? data.errors ?? 0,
      });
      toast.success('Bulk mail job completed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk mail failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '44rem' }}>
      <div className="flex items-center gap-3 mb-2">
        <FiMail style={{ fontSize: '1.75rem', color: 'var(--ch-red)' }} />
        <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: '2.25rem', color: 'var(--ch-red)' }}>
          Bulk Credential Mail
        </h1>
      </div>
      <p className="text-sm font-semibold mb-8" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
        Send login credentials to students who have not yet received their welcome email.
      </p>

      {/* What the email contains */}
      <div className="comic-card mb-6">
        <h2
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '1.2rem',
            color: 'var(--ch-ink)',
            marginBottom: '0.75rem',
            letterSpacing: '0.04em',
          }}
        >
          What Does the Email Contain?
        </h2>
        <ul className="space-y-2 text-sm font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.75 }}>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--ch-grass)', flexShrink: 0, marginTop: '2px' }}>&#10003;</span>
            Student&rsquo;s generated Login ID
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--ch-grass)', flexShrink: 0, marginTop: '2px' }}>&#10003;</span>
            Temporary password for first login
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--ch-grass)', flexShrink: 0, marginTop: '2px' }}>&#10003;</span>
            Link to the Calvin CCA Platform
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--ch-grass)', flexShrink: 0, marginTop: '2px' }}>&#10003;</span>
            Instructions to change the password after first login
          </li>
        </ul>
      </div>

      {/* Warning */}
      <div
        className="mb-6 px-4 py-3"
        style={{
          background: '#FFF8E0',
          border: '2px solid var(--ch-gold)',
          boxShadow: '3px 3px 0 var(--ch-ink)',
          borderRadius: '4px',
        }}
      >
        <div className="flex items-start gap-2">
          <FiAlertTriangle style={{ color: 'var(--ch-gold)', fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--ch-ink)' }}>
            This will send login credential emails to <em>all students who have not yet received one</em>. This action cannot be undone. Only run this once per cohort.
          </p>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          id="confirm-bulk"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{
            width: '1.1rem',
            height: '1.1rem',
            accentColor: 'var(--ch-red)',
            cursor: 'pointer',
            border: '2px solid var(--ch-ink)',
          }}
        />
        <label
          htmlFor="confirm-bulk"
          className="text-sm font-bold cursor-pointer"
          style={{ color: 'var(--ch-ink)' }}
        >
          I understand this will send emails to all un-emailed students. Proceed.
        </label>
      </div>

      {/* Send button */}
      <button
        className="btn-calvin"
        style={{ fontSize: '1rem', padding: '0.65rem 1.75rem' }}
        onClick={handleSend}
        disabled={sending || !confirmed}
      >
        <FiMail />
        <span>{sending ? 'Sending emails...' : 'Send Bulk Emails'}</span>
      </button>

      {/* Result */}
      {result && (
        <div
          className="mt-6 px-5 py-4"
          style={{
            background: '#ffffff',
            border: '2px solid var(--ch-ink)',
            boxShadow: '3px 3px 0 var(--ch-ink)',
            borderRadius: '4px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FiCheckCircle style={{ color: 'var(--ch-grass)', fontSize: '1.25rem' }} />
            <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: '1.2rem', color: 'var(--ch-grass)', letterSpacing: '0.04em' }}>
              Mail Job Completed
            </h3>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--ch-ink)' }}>
            Sent: <span style={{ color: 'var(--ch-grass)' }}>{result.sent}</span>
            {' '}  &bull;  {'  '}
            Failed: <span style={{ color: result.failed > 0 ? 'var(--ch-red)' : 'inherit' }}>{result.failed}</span>
          </p>
          {result.failed > 0 && (
            <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--ch-red)', opacity: 0.8 }}>
              Some emails could not be sent. Check server logs for details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
