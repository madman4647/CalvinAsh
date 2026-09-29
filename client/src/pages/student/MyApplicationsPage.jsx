import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { formatDate, ccaTypeLabel } from '../../utils/formatters';
import { FiEye, FiTrash2, FiCheckSquare, FiSquare } from 'react-icons/fi';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchApps = () => {
    api.get('/applications/my')
      .then((res) => setApplications(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === applications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(applications.map((a) => a._id)));
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      toast.success('Application withdrawn');
      setSelected((prev) => { const n = new Set(prev); n.delete(appId); return n; });
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.size} application(s)?`)) return;
    setBulkDeleting(true);
    let failed = 0;
    for (const id of selected) {
      try {
        await api.delete(`/applications/${id}`);
      } catch {
        failed++;
      }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    if (failed > 0) {
      toast.error(`${failed} deletion(s) failed`);
    } else {
      toast.success('Selected applications deleted');
    }
    fetchApps();
  };

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
    <div className="page-container">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 style={{ fontFamily: "'Bangers', cursive", color: 'var(--ch-red)', fontSize: '2.25rem' }}>
          My Applications
        </h1>

        {applications.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="btn-calvin-outline text-sm px-3 py-1.5"
            >
              {selected.size === applications.length ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
              <span>{selected.size === applications.length ? 'Deselect All' : 'Select All'}</span>
            </button>

            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="btn-danger text-sm px-3 py-1.5"
              >
                <FiTrash2 size={14} />
                <span>
                  {bulkDeleting ? 'Deleting...' : `Delete Selected (${selected.size})`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {applications.length === 0 ? (
        <div
          className="comic-card text-center py-12"
        >
          <p className="font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
            You have not submitted any applications yet.
          </p>
          <button onClick={() => navigate('/student/ccas')} className="btn-calvin mt-4">
            Browse CCAs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="comic-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                borderColor: selected.has(app._id) ? 'var(--ch-sky)' : 'var(--ch-ink)',
                boxShadow: selected.has(app._id) ? '3px 3px 0 var(--ch-sky)' : '3px 3px 0 var(--ch-ink)',
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(app._id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, color: selected.has(app._id) ? 'var(--ch-sky)' : 'var(--ch-ink)', opacity: selected.has(app._id) ? 1 : 0.4 }}
              >
                {selected.has(app._id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
              </button>

              <div className="flex-1">
                <h3 style={{ fontWeight: 800, color: 'var(--ch-ink)', fontSize: '1.05rem' }}>
                  {app.committee?.name || app.committeeName || 'Unknown CCA'}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs font-semibold capitalize" style={{ color: 'var(--ch-ink)', opacity: 0.6 }}>
                    {ccaTypeLabel(app.committee?.type || app.committeeType)}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.45 }}>
                    Applied: {formatDate(app.createdAt || app.appliedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={app.status} />
                <button
                  onClick={() => navigate(`/student/applications/${app._id}`)}
                  className="btn-calvin-outline text-sm px-3 py-1.5"
                >
                  <FiEye size={14} />
                  <span>View</span>
                </button>
                {app.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(app._id)}
                    className="btn-danger text-sm px-3 py-1.5"
                  >
                    <FiTrash2 size={14} />
                    <span>Withdraw</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
