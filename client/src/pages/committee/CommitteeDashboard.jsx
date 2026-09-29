import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDeadline, ccaTypeLabel } from '../../utils/formatters';
import { FiEdit, FiUsers, FiCalendar, FiFileText } from 'react-icons/fi';

export default function CommitteeDashboard() {
  const { user } = useAuth();
  const [committee, setCommittee] = useState(null);
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/committees/my')
      .then((res) => {
        setCommittee(res.data);
        return api.get(`/committees/${res.data._id}/applications`);
      })
      .then((res) => {
        const apps = Array.isArray(res.data) ? res.data : res.data.applications || [];
        setAppCount(apps.length);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-800">
          {committee?.name || 'Committee Dashboard'}
        </h1>
        {committee?.type && (
          <p className="text-gray-500 capitalize mt-1">{ccaTypeLabel(committee.type)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <FiUsers className="text-2xl text-primary-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-800">{appCount}</p>
            <p className="text-sm text-gray-500">Total Applications</p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-gold-50 rounded-lg">
            <FiCalendar className="text-2xl text-gold-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Deadline</p>
            <p className="text-sm text-gray-500">{formatDeadline(committee?.deadline)}</p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <FiFileText className="text-2xl text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Max Candidates</p>
            <p className="text-sm text-gray-500">{committee?.maxCandidates || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/committee/form"
          className="card hover:shadow-lg hover:border-gold-400 transition-all duration-300 group"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-gold-50 transition-colors">
              <FiEdit className="text-2xl text-primary-700 group-hover:text-gold-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800">Edit Form</h3>
              <p className="text-sm text-gray-500 mt-1">
                Customize application questions, deadline, and settings
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/committee/applications"
          className="card hover:shadow-lg hover:border-gold-400 transition-all duration-300 group"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-gold-50 transition-colors">
              <FiUsers className="text-2xl text-primary-700 group-hover:text-gold-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800">View Applications</h3>
              <p className="text-sm text-gray-500 mt-1">
                Review, select, and manage applicants
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
