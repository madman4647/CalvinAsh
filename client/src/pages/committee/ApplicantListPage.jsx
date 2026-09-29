import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ExcelExportButton from '../../components/ExcelExportButton';
import toast from 'react-hot-toast';
import { FiDownload, FiCheck, FiClock, FiX, FiEye } from 'react-icons/fi';

export default function ApplicantListPage() {
  const [applications, setApplications] = useState([]);
  const [committee, setCommittee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const commRes = await api.get('/committees/my');
      setCommittee(commRes.data);
      const appRes = await api.get(`/committees/${commRes.data._id}/applications`);
      setApplications(Array.isArray(appRes.data) ? appRes.data : appRes.data.applications || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (appId, status, waitlistRank) => {
    try {
      const body = { status };
      if (waitlistRank) body.waitlistRank = waitlistRank;
      await api.put(`/applications/${appId}/status`, body);
      toast.success(`Applicant ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updateTask = async (appId, task) => {
    try {
      await api.put(`/applications/${appId}/task`, { task });
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedIds.size === 0) {
      toast.error('No applicants selected');
      return;
    }
    if (!window.confirm(`${status === 'selected' ? 'Select' : 'Reject'} ${selectedIds.size} applicant(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.put(`/applications/${id}/status`, { status }))
      );
      toast.success(`${selectedIds.size} applicant(s) ${status}`);
      setSelectedIds(new Set());
      fetchData();
    } catch {
      toast.error('Some updates failed');
      fetchData();
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const columns = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row._id)}
          onChange={() => toggleSelect(row._id)}
          className="w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      header: 'Student Name',
      accessor: (row) => row.student?.name || row.studentName || 'N/A',
    },
    {
      key: 'batch',
      header: 'Batch',
      accessor: (row) => row.student?.batch || row.batch || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'task',
      header: 'Task',
      render: (row) => (
        <input
          type="text"
          defaultValue={row.task || ''}
          onBlur={(e) => {
            if (e.target.value !== (row.task || '')) {
              updateTask(row._id, e.target.value);
            }
          }}
          className="input-field text-sm py-1 px-2"
          placeholder="Assign task..."
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/committee/applications/${row._id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-600 rounded"
            title="View"
          >
            <FiEye size={16} />
          </button>
          <button
            onClick={() => updateStatus(row._id, 'selected')}
            className="p-1.5 text-green-500 hover:text-green-700 rounded"
            title="Select"
          >
            <FiCheck size={16} />
          </button>
          <button
            onClick={() => {
              const rank = prompt('Enter waitlist rank:');
              if (rank) updateStatus(row._id, 'waitlisted', parseInt(rank));
            }}
            className="p-1.5 text-blue-500 hover:text-blue-700 rounded"
            title="Waitlist"
          >
            <FiClock size={16} />
          </button>
          <button
            onClick={() => updateStatus(row._id, 'rejected')}
            className="p-1.5 text-red-500 hover:text-red-700 rounded"
            title="Reject"
          >
            <FiX size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1>Applications ({applications.length})</h1>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <>
              <button onClick={() => handleBulkAction('selected')} className="btn-primary text-sm flex items-center space-x-1">
                <FiCheck />
                <span>Select ({selectedIds.size})</span>
              </button>
              <button onClick={() => handleBulkAction('rejected')} className="btn-danger text-sm flex items-center space-x-1">
                <FiX />
                <span>Reject ({selectedIds.size})</span>
              </button>
            </>
          )}
          {committee && (
            <>
              <ExcelExportButton
                url={`/committees/${committee._id}/export`}
                filename={`${committee.name}_applications.xlsx`}
              />
              <button
                onClick={async () => {
                  try {
                    const res = await api.get(`/committees/${committee._id}/resumes`, { responseType: 'blob' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
                    link.download = `${committee.name}_resumes.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch {
                    toast.error('Failed to download resumes');
                  }
                }}
                className="btn-outline text-sm flex items-center space-x-1"
              >
                <FiDownload />
                <span>Resumes ZIP</span>
              </button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        onRowClick={(row) => navigate(`/committee/applications/${row._id}`)}
      />
    </div>
  );
}
