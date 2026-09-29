import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ccaTypeLabel } from '../../utils/formatters';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/council/applications')
      .then((res) => setApplications(Array.isArray(res.data) ? res.data : res.data.applications || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter((app) => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    const type = app.committee?.type || app.committeeType;
    if (filterType !== 'all' && type !== filterType) return false;
    return true;
  });

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      accessor: (row) => row.student?.name || row.studentName || 'N/A',
    },
    {
      key: 'studentId',
      header: 'ID',
      accessor: (row) => row.student?.loginId || row.student?.pgpId || 'N/A',
    },
    {
      key: 'committee',
      header: 'Committee',
      accessor: (row) => row.committee?.name || row.committeeName || 'N/A',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="capitalize">
          {ccaTypeLabel(row.committee?.type || row.committeeType)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
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
      <h1 className="mb-6">All Applications</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="label">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="selected">Selected</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All</option>
            <option value="committee">Committee</option>
            <option value="club">Club</option>
            <option value="aig">AIG</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/council/applications/student/${row.student?._id || row.studentId}`)}
        />
      </div>
    </div>
  );
}
