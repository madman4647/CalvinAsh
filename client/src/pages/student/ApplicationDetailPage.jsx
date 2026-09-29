import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';

export default function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/applications/${applicationId}`)
      .then((res) => {
        setApplication(res.data);
        setAnswers(res.data.answers || []);
      })
      .catch(() => toast.error('Failed to load application'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));
      if (resume) {
        formData.append('resume', resume);
      }
      await api.put(`/applications/${applicationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Application updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    try {
      await api.delete(`/applications/${applicationId}`);
      toast.success('Application withdrawn');
      navigate('/student/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
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

  const isEditable = application.status === 'pending';

  return (
    <div className="page-container max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 mb-4"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-800">
              {application.committee?.name || application.committeeName || 'Application'}
            </h1>
            <p className="text-sm text-gray-500 capitalize mt-1">
              {application.committee?.type || application.committeeType}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="space-y-6">
          {answers.map((item, i) => (
            <div key={i}>
              <label className="label">{item.question}</label>
              {isEditable ? (
                <textarea
                  value={item.answer || ''}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    setAnswers(updated);
                  }}
                  rows={4}
                  className="input-field resize-y"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{item.answer || 'No answer'}</p>
              )}
            </div>
          ))}

          {application.resumeUrl && (
            <div>
              <label className="label">Submitted Resume</label>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline text-sm"
              >
                View Resume
              </a>
            </div>
          )}

          {isEditable && (
            <FileUpload
              accept=".pdf,.doc,.docx"
              maxSize={5}
              onFileSelect={setResume}
              label="Upload New Resume (optional)"
            />
          )}

          {application.task && (
            <div>
              <label className="label">Assigned Task</label>
              <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                <p className="text-gray-800">{application.task}</p>
              </div>
            </div>
          )}
        </div>

        {isEditable && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleWithdraw}
              className="btn-danger flex items-center space-x-2"
            >
              <FiTrash2 />
              <span>Withdraw</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <FiSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
