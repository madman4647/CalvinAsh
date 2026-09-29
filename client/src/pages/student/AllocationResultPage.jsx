import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function AllocationResultPage() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/allocations/my')
      .then((res) => setAllocation(res.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load allocation result');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="page-container max-w-2xl">
        <h1 className="mb-6">Allocation Result</h1>
        <div className="card text-center py-12">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Allocation results have not been published yet.</p>
          <p className="text-sm text-gray-400 mt-2">Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <h1 className="mb-6">Allocation Result</h1>

      {allocation.status === 'allocated' || allocation.allocatedCommittee ? (
        <div className="card border-green-200 bg-green-50">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <FiCheckCircle className="text-2xl text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-800">Congratulations!</h2>
              <p className="text-green-700 mt-2">
                You have been allocated to:
              </p>
              <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-bold text-primary-800">
                  {allocation.committee?.name || allocation.allocatedCommittee || allocation.committeeName}
                </h3>
                <p className="text-sm text-gray-500 capitalize mt-1">
                  {allocation.committee?.type || allocation.committeeType}
                </p>
                {allocation.studentRank && (
                  <p className="text-sm text-gray-600 mt-2">
                    Your preference rank: #{allocation.studentRank}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : allocation.status === 'waitlisted' ? (
        <div className="card border-blue-200 bg-blue-50">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiClock className="text-2xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-800">Waitlisted</h2>
              <p className="text-blue-700 mt-2">
                You are on the waitlist for:
              </p>
              <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-bold text-primary-800">
                  {allocation.committee?.name || allocation.committeeName}
                </h3>
                {allocation.waitlistRank && (
                  <p className="text-sm text-gray-600 mt-2">
                    Waitlist position: #{allocation.waitlistRank}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No allocation has been made yet.</p>
        </div>
      )}
    </div>
  );
}
