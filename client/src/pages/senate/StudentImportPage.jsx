import { useState } from 'react';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import FileDrop from '../../components/ui/FileDrop.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';
import { api } from '../../api/client.js';

export default function StudentImportPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleImport() {
    if (!file) return;
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/senate/students/import', formData);
      setResult(res);
    } catch (err) {
      setError(err.body?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="font-heading text-2xl">Import students</h1>
      <ComicPanel variant="quiet" className="flex flex-col gap-4">
        <p className="text-sm">
          A CSV with columns <code>login_id, name, email, batch</code>. A row whose login ID
          already exists is skipped, so re-running an import to add more students is safe.
        </p>
        <FileDrop label="Student CSV" accept=".csv" onFileSelected={setFile} />
        {file && <p className="text-sm">Selected: {file.name}</p>}
        <Button onClick={handleImport} variant="accent" quiet disabled={!file || submitting}>
          Import students
        </Button>
        {error && <Toast kind="error" message={error} />}
        {result && (
          <Toast
            kind="success"
            message={`Created ${result.created} account(s). Skipped ${result.skipped.length}.`}
          />
        )}
        {result?.skipped.length > 0 && (
          <ul className="text-sm list-disc pl-5">
            {result.skipped.map((s) => (
              <li key={s.loginId}>{s.loginId}: {s.reason}</li>
            ))}
          </ul>
        )}
      </ComicPanel>
    </main>
  );
}
