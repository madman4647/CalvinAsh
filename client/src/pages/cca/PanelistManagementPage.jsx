import { useEffect, useState } from 'react';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api } from '../../api/client.js';

export default function PanelistManagementPage() {
  const [panelists, setPanelists] = useState([]);
  const [form, setForm] = useState({ loginId: '', name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadPanelists() {
    const rows = await api.get('/api/cca/panelists');
    setPanelists(rows);
  }

  useEffect(() => {
    loadPanelists();
  }, []);

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/api/cca/panelists', form);
      setSuccess(res.linkedExisting ? 'Linked the existing panelist to this CCA.' : 'Added a new panelist.');
      setForm({ loginId: '', name: '', email: '' });
      await loadPanelists();
    } catch (err) {
      setError(err.body?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="font-heading text-2xl">Panelists</h1>
      <ComicPanel variant="quiet" className="flex flex-col gap-4">
        <p className="text-sm">
          If the login ID already belongs to a panelist elsewhere, they are linked to this CCA
          too - name and email are only used to create a brand new panelist.
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Login ID" value={form.loginId} onChange={updateField('loginId')} required />
          <Field label="Name (new panelist only)" value={form.name} onChange={updateField('name')} />
          <Field label="Email (new panelist only)" type="email" value={form.email} onChange={updateField('email')} />
          {error && <Toast kind="error" message={error} />}
          {success && <Toast kind="success" message={success} />}
          <Button type="submit" variant="accent" disabled={submitting}>
            Add panelist
          </Button>
        </form>
      </ComicPanel>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl">Current panelists</h2>
        {panelists.length === 0 ? (
          <EmptyState title="No panelists yet" message="Panelists you add will show up here." />
        ) : (
          <ul className="flex flex-col gap-2">
            {panelists.map((p) => (
              <li key={p.account_id} className="dense-panel px-4 py-2 flex justify-between">
                <span>{p.name}</span>
                <span className="text-sm opacity-70">{p.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
