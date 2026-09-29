import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const defaultSettings = {
  student_access: true,
  committee_access: true,
  ranking_enabled: true,
  max_applications: 4,
  max_hostel_applications: 10,
  deadline_grace_period: 300,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        if (res.data) setSettings({ ...defaultSettings, ...res.data });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNumber = (key, value) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 0) setSettings((prev) => ({ ...prev, [key]: n }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({ label, desc, settingKey }) => (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: '1.5px dashed rgba(26,26,26,0.2)' }}
    >
      <div>
        <p className="font-bold text-sm" style={{ color: 'var(--ch-ink)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>{desc}</p>}
      </div>
      <button
        onClick={() => handleToggle(settingKey)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: settings[settingKey] ? 'var(--ch-grass)' : 'var(--ch-red)',
        }}
      >
        {settings[settingKey]
          ? <FiToggleRight size={28} />
          : <FiToggleLeft size={28} />
        }
        <span>{settings[settingKey] ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );

  const NumberRow = ({ label, desc, settingKey, min = 0, max = 9999 }) => (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: '1.5px dashed rgba(26,26,26,0.2)' }}
    >
      <div>
        <p className="font-bold text-sm" style={{ color: 'var(--ch-ink)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>{desc}</p>}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={settings[settingKey]}
        onChange={(e) => handleNumber(settingKey, e.target.value)}
        className="input-field"
        style={{ width: '7rem', textAlign: 'right', fontWeight: 700 }}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: 'var(--ch-red)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '42rem' }}>
      <div className="flex items-center gap-3 mb-2">
        <FiSettings style={{ fontSize: '1.75rem', color: 'var(--ch-red)' }} />
        <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: '2.25rem', color: 'var(--ch-red)' }}>
          Platform Settings
        </h1>
      </div>
      <p className="text-sm font-semibold mb-8" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
        Control platform-wide access and configuration.
      </p>

      <div className="comic-card mb-6">
        <h2
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '1.25rem',
            color: 'var(--ch-ink)',
            marginBottom: '0.5rem',
            letterSpacing: '0.04em',
          }}
        >
          Access Controls
        </h2>

        <ToggleRow
          label="Student Access Enabled"
          desc="When off, students cannot log in or access their portal."
          settingKey="student_access"
        />
        <ToggleRow
          label="Committee Access Enabled"
          desc="When off, committee members cannot log in or view applications."
          settingKey="committee_access"
        />
        <ToggleRow
          label="Ranking Enabled"
          desc="Allow students to rank their CCA applications by preference."
          settingKey="ranking_enabled"
        />
      </div>

      <div className="comic-card mb-8">
        <h2
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '1.25rem',
            color: 'var(--ch-ink)',
            marginBottom: '0.5rem',
            letterSpacing: '0.04em',
          }}
        >
          Limits &amp; Timings
        </h2>

        <NumberRow
          label="Max CCA Applications"
          desc="Maximum number of CCA applications a student can submit."
          settingKey="max_applications"
          min={1}
          max={20}
        />
        <NumberRow
          label="Max Hostel Applications"
          desc="Maximum hostel nominations per student."
          settingKey="max_hostel_applications"
          min={1}
          max={50}
        />
        <NumberRow
          label="Deadline Grace Period (seconds)"
          desc="Extra time allowed after a CCA deadline before submissions are blocked."
          settingKey="deadline_grace_period"
          min={0}
          max={86400}
        />
      </div>

      <button
        className="btn-calvin"
        style={{ fontSize: '1rem', padding: '0.65rem 1.75rem' }}
        onClick={handleSave}
        disabled={saving}
      >
        <FiSave />
        <span>{saving ? 'Saving...' : 'Save Settings'}</span>
      </button>
    </div>
  );
}
