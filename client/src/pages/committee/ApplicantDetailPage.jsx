import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiClock, FiX, FiDownload, FiUser, FiMail, FiPhone, FiBook } from 'react-icons/fi';

export default function ApplicantDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get(`/applications/${applicationId}`)
      .then((res) => {
        setApplication(res.data);
        setTask(res.data.task || '');
      })
      .catch(() => toast.error('Failed to load application'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [applicationId]);

  const updateStatus = async (status, waitlistRank) => {
    try {
      const body = { status };
      if (waitlistRank) body.waitlistRank = waitlistRank;
      await api.put(`/applications/${applicationId}/status`, body);
      toast.success(`Applicant ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const saveTask = async () => {
    try {
      await api.put(`/applications/${applicationId}/task`, { task });
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Application not found.</p>
      </div>
    );
  }

  const student = application.student || {};

  return (
    <div className="page-container max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 mb-4"
      >
        <FiArrowLeft />
        <span>Back to Applications</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">Student Profile</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiUser className="text-primary-600" />
                <div>
                  <p className="font-medium">{student.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{student.loginId || student.pgpId || ''}</p>
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
              {(student.cgpa || student.tenthPercent || student.twelfthPercent) && (
                <div className="pt-3 border-t border-gray-200 space-y-1">
                  {student.cgpa && <p className="text-sm text-gray-600">CGPA: {student.cgpa}</p>}
                  {student.tenthPercent && <p className="text-sm text-gray-600">10th: {student.tenthPercent}%</p>}
                  {student.twelfthPercent && <p className="text-sm text-gray-600">12th: {student.twelfthPercent}%</p>}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-3">Selection</h2>
            <div className="mb-4">
              <StatusBadge status={application.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateStatus('selected')} className="btn-primary text-sm flex items-center space-x-1">
                <FiCheck size={14} /> <span>Select</span>
              </button>
              <button
                onClick={() => {
                  const rank = prompt('Enter waitlist rank:');
                  if (rank) updateStatus('waitlisted', parseInt(rank));
                }}
                className="btn-outline text-sm flex items-center space-x-1"
              >
                <FiClock size={14} /> <span>Waitlist</span>
              </button>
              <button onClick={() => updateStatus('rejected')} className="btn-danger text-sm flex items-center space-x-1">
                <FiX size={14} /> <span>Reject</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-3">Assign Task</h2>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
              className="input-field resize-y"
              placeholder="Enter task for the applicant..."
            />
            <button onClick={saveTask} className="btn-secondary text-sm mt-3">
              Save Task
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">Application Answers</h2>
            <div className="space-y-5">
              {(application.answers || []).map((item, i) => (
                <div key={i}>
                  <label className="label">{item.question}</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{item.answer || 'No answer'}</p>
                </div>
              ))}
              {(!application.answers || application.answers.length === 0) && (
                <p className="text-gray-500">No answers submitted.</p>
              )}
            </div>

            {application.resumeUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-primary-800 mb-2">Resume</h3>
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm inline-flex items-center space-x-1"
                >
                  <FiDownload size={14} />
                  <span>Download Resume</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
