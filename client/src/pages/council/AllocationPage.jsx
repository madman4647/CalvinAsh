import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiPlay, FiRefreshCw, FiCheckCircle, FiUsers, FiAlertTriangle } from 'react-icons/fi';

export default function AllocationPage() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchAllocations = () => {
    api.get('/council/allocations')
      .then((res) => setAllocations(Array.isArray(res.data) ? res.data : res.data.allocations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAllocations(); }, []);

  const runAllocation = async () => {
    if (!window.confirm('Are you sure you want to run the allocation algorithm? This will process all selected and waitlisted applicants.')) return;
    setRunning(true);
    try {
      await api.post('/council/allocate');
      toast.success('Allocation completed successfully!');
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setRunning(false);
    }
  };

  const clearAndRerun = async () => {
    if (!window.confirm('This will clear all existing allocations and re-run the algorithm. Are you sure?')) return;
    setRunning(true);
    try {
      await api.post('/council/allocate/clear');
      await api.post('/council/allocate');
      toast.success('Allocation re-run completed!');
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-run failed');
    } finally {
      setRunning(false);
    }
  };

  const allocated = allocations.filter((a) => a.status === 'allocated');
  const waitlisted = allocations.filter((a) => a.status === 'waitlisted');
  const unallocated = allocations.filter((a) => a.status === 'unallocated');

  const columns = [
    {
      key: 'student',
      header: 'Student',
      accessor: (row) => row.student?.name || row.studentName || 'N/A',
    },
    {
      key: 'committee',
      header: 'Allocated CCA',
      accessor: (row) => row.committee?.name || row.committeeName || 'N/A',
    },
    {
      key: 'studentRank',
      header: 'Student Rank',
      accessor: (row) => row.studentRank || 'N/A',
    },
    {
      key: 'committeeRank',
      header: 'Committee Rank',
      accessor: (row) => row.committeeRank || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1>Allocation</h1>
        <div className="flex gap-2">
          <button
            onClick={runAllocation}
            disabled={running}
            className="btn-primary flex items-center space-x-2"
          >
            {running ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <FiPlay />
                <span>Run Allocation</span>
              </>
            )}
          </button>
          {allocations.length > 0 && (
            <button
              onClick={clearAndRerun}
              disabled={running}
              className="btn-outline flex items-center space-x-2"
            >
              <FiRefreshCw />
              <span>Clear & Re-run</span>
            </button>
          )}
        </div>
      </div>

      {allocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <FiCheckCircle className="text-2xl text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{allocated.length}</p>
              <p className="text-sm text-gray-500">Allocated</p>
            </div>
          </div>
          <div className="card flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FiUsers className="text-2xl text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{waitlisted.length}</p>
              <p className="text-sm text-gray-500">Waitlisted</p>
            </div>
          </div>
          <div className="card flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FiAlertTriangle className="text-2xl text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{unallocated.length}</p>
              <p className="text-sm text-gray-500">Unallocated</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={allocations} />
      </div>
    </div>
  );
}
