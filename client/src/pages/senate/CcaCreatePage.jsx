import { useEffect, useState } from 'react';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import Field from '../../components/ui/Field.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api } from '../../api/client.js';

const TYPE_OPTIONS = [
  { value: 'committee', label: 'Committee' },
  { value: 'club', label: 'Club' },
  { value: 'aig', label: 'AIG' },
];

export default function CcaCreatePage() {
  const [ccas, setCcas] = useState([]);
  const [form, setForm] = useState({ loginId: '', name: '', type: 'committee', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCcas() {
    const rows = await api.get('/api/senate/ccas');
    setCcas(rows);
  }

  useEffect(() => {
    loadCcas();
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
      await api.post('/api/senate/ccas', form);
      setSuccess(`Created "${form.name}".`);
      setForm({ loginId: '', name: '', type: 'committee', email: '' });
      await loadCcas();
    } catch (err) {
      setError(err.body?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="font-heading text-2xl">Create a CCA account</h1>
      <ComicPanel variant="quiet" className="flex flex-col gap-4">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Login ID" value={form.loginId} onChange={updateField('loginId')} required />
          <Field label="Name" value={form.name} onChange={updateField('name')} required />
          <Select label="Type" value={form.type} onChange={updateField('type')} options={TYPE_OPTIONS} />
          <Field label="Email" type="email" value={form.email} onChange={updateField('email')} required />
          {error && <Toast kind="error" message={error} />}
          {success && <Toast kind="success" message={success} />}
          <Button type="submit" variant="accent" quiet disabled={submitting}>
            Create CCA account
          </Button>
        </form>
      </ComicPanel>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl">Existing CCAs</h2>
        {ccas.length === 0 ? (
          <EmptyState title="No CCAs yet" message="CCAs you create will show up here." />
        ) : (
          <ul className="flex flex-col gap-2">
            {ccas.map((cca) => (
              <li key={cca.account_id} className="dense-panel px-4 py-2 flex justify-between">
                <span>{cca.name}</span>
                <span className="text-sm opacity-70">{cca.type}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
