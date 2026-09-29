import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiClock, FiX } from 'react-icons/fi';

export default function CommitteeApplicationsPage() {
  const { committeeId } = useParams();
  const navigate = useNavigate();
  const [committee, setCommittee] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [commRes, appRes] = await Promise.all([
        api.get(`/committees/${committeeId}`),
        api.get(`/council/committees/${committeeId}/applications`),
      ]);
      setCommittee(commRes.data);
      setApplications(Array.isArray(appRes.data) ? appRes.data : appRes.data.applications || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [committeeId]);

  const overrideStatus = async (appId, status) => {
    try {
      await api.put(`/council/applications/${appId}/override`, { status });
      toast.success(`Status overridden to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to override');
    }
  };

  const columns = [
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
      key: 'rank',
      header: 'Student Rank',
      accessor: (row) => row.rank || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Override',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => overrideStatus(row._id, 'selected')} className="p-1.5 text-green-500 hover:text-green-700" title="Select">
            <FiCheck size={16} />
          </button>
          <button onClick={() => overrideStatus(row._id, 'waitlisted')} className="p-1.5 text-blue-500 hover:text-blue-700" title="Waitlist">
            <FiClock size={16} />
          </button>
          <button onClick={() => overrideStatus(row._id, 'rejected')} className="p-1.5 text-red-500 hover:text-red-700" title="Reject">
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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 mb-4"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>{committee?.name || 'Committee'} - Applications</h1>
          <p className="text-gray-500 capitalize">{committee?.type}</p>
        </div>
        <p className="text-sm text-gray-500">{applications.length} applications</p>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={applications}
          onRowClick={(row) => navigate(`/council/applications/student/${row.student?._id || row.studentId}`)}
        />
      </div>
    </div>
  );
}
