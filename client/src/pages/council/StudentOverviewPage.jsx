import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ccaTypeLabel } from '../../utils/formatters';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiBook } from 'react-icons/fi';

export default function StudentOverviewPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/council/students/${studentId}`)
      .then((res) => {
        setStudent(res.data.student || res.data);
        setApplications(res.data.applications || []);
        setAllocation(res.data.allocation || null);
      })
      .catch(() => toast.error('Failed to load student data'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 mb-4"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">Student Info</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiUser className="text-primary-600" />
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.loginId || student.pgpId}</p>
                </div>
              </div>
              {student.batch && (
                <div className="flex items-center space-x-3">
                  <FiBook className="text-primary-600" />
                  <p className="text-sm">Batch: {student.batch}</p>
                </div>
              )}
              {student.email && (
                <div className="flex items-center space-x-3">
                  <FiMail className="text-primary-600" />
                  <p className="text-sm">{student.email}</p>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center space-x-3">
                  <FiPhone className="text-primary-600" />
                  <p className="text-sm">{student.phone}</p>
                </div>
              )}
            </div>
          </div>

          {allocation && (
            <div className="card mt-6 border-green-200 bg-green-50">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Allocation</h2>
              <p className="font-medium text-green-900">
                {allocation.committee?.name || allocation.committeeName || 'Allocated'}
              </p>
              <p className="text-sm text-green-700 capitalize mt-1">
                {allocation.status}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">
              Applications ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <p className="text-gray-500">No applications found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Committee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map((app) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {app.committee?.name || app.committeeName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                          {ccaTypeLabel(app.committee?.type || app.committeeType)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {app.rank || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
