import { useState } from 'react';
import ComicPanel from '../components/ui/ComicPanel.jsx';
import Button from '../components/ui/Button.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import StateBanner from '../components/ui/StateBanner.jsx';
import ProgressMap from '../components/ui/ProgressMap.jsx';
import Field from '../components/ui/Field.jsx';
import Select from '../components/ui/Select.jsx';
import FileDrop from '../components/ui/FileDrop.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Toast from '../components/ui/Toast.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Loader from '../components/ui/Loader.jsx';

const BUTTON_VARIANTS = ['primary', 'accent', 'secondary', 'plain', 'danger'];
const BUTTON_SIZES = ['sm', 'md', 'lg'];
const STATUSES = ['normal', 'active', 'pending', 'attention', 'critical'];

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentGalleryPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="max-w-5xl mx-auto p-6 flex flex-col gap-10">
      <header>
        <h1 className="font-heading text-4xl">Calvin component gallery</h1>
        <p className="mt-2">Every base component from docs/UI-UX.md, for the Loop 0 screenshot test.</p>
      </header>

      <hr className="squiggle" />

      <Section title="ComicPanel">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComicPanel>
            <p className="font-semibold">default</p>
          </ComicPanel>
          <ComicPanel variant="highlight">
            <p className="font-semibold">highlight</p>
          </ComicPanel>
          <ComicPanel variant="quiet">
            <p className="font-semibold">quiet</p>
          </ComicPanel>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-col gap-3">
          {BUTTON_SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="text-sm w-10">{size}</span>
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="text-sm w-10">quiet</span>
            <Button variant="primary" quiet>
              SUBMIT &amp; LOCK MARKS
            </Button>
          </div>
        </div>
      </Section>

      <Section title="StatusBadge">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="StateBanner">
        <StateBanner status="active" title="Round 2 - Task evaluation" subtitle="Evaluation in progress" />
      </Section>

      <Section title="ProgressMap">
        <ProgressMap
          steps={[
            { label: 'Applied', done: true },
            { label: 'Task', done: true },
            { label: 'Interview', current: true },
            { label: 'Result', done: false },
          ]}
        />
      </Section>

      <Section title="Field, Select, FileDrop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Name" placeholder="Your name" />
          <Field label="Email" error="Enter a valid email address" />
          <Select label="Round" options={[{ value: 'task', label: 'Task' }, { value: 'interview', label: 'Interview' }]} />
          <FileDrop label="Resume" accept=".pdf" />
        </div>
      </Section>

      <Section title="ConfirmDialog">
        <Button variant="plain" onClick={() => setConfirmOpen(true)}>
          Open confirm dialog
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          title="Withdraw application?"
          message="This cannot be undone. You will need to reapply if you change your mind."
          confirmLabel="Withdraw application"
          onConfirm={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
        />
      </Section>

      <Section title="Toast, EmptyState, Loader">
        <div className="flex flex-col gap-4">
          <Toast kind="success" message="Your submission has been successfully recorded." />
          <Toast kind="error" message="Something went wrong. Please try again." />
          <Toast kind="info" message="Applications close on 12 Oct." />
          <EmptyState title="No applications yet" message="CCAs you apply to will show up here." />
          <Loader />
        </div>
      </Section>
    </main>
  );
}
