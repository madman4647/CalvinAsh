import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';
import { ccaTypeLabel } from '../../utils/formatters';
import { FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function CouncilDashboard() {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/council/committees')
      .then((res) => setCommittees(Array.isArray(res.data) ? res.data : res.data.committees || []))
      .catch(() => toast.error('Failed to load committees'))
      .finally(() => setLoading(false));
  }, []);

  const totals = committees.reduce(
    (acc, c) => ({
      apps: acc.apps + (c.applicationCount || 0),
      selected: acc.selected + (c.selectedCount || 0),
      waitlisted: acc.waitlisted + (c.waitlistedCount || 0),
    }),
    { apps: 0, selected: 0, waitlisted: 0 }
  );

  const columns = [
    { key: 'name', header: 'Name', accessor: 'name' },
    {
      key: 'type',
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className="capitalize">{ccaTypeLabel(row.type)}</span>
      ),
    },
    { key: 'apps', header: 'Applications', accessor: (row) => row.applicationCount || 0 },
    { key: 'avgRank', header: 'Avg Student Rank', accessor: (row) => row.avgStudentRank ? row.avgStudentRank.toFixed(1) : 'N/A' },
    { key: 'selected', header: 'Selected', accessor: (row) => row.selectedCount || 0 },
    { key: 'waitlisted', header: 'Waitlisted', accessor: (row) => row.waitlistedCount || 0 },
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
      <h1 className="mb-6">Council Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <FiUsers className="text-2xl text-primary-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-800">{totals.apps}</p>
            <p className="text-sm text-gray-500">Total Applications</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <FiCheckCircle className="text-2xl text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{totals.selected}</p>
            <p className="text-sm text-gray-500">Total Selected</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FiClock className="text-2xl text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{totals.waitlisted}</p>
            <p className="text-sm text-gray-500">Total Waitlisted</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-primary-800 mb-4">All Committees</h2>
        <DataTable
          columns={columns}
          data={committees}
          onRowClick={(row) => navigate(`/council/committees/${row._id}`)}
        />
      </div>
    </div>
  );
}
