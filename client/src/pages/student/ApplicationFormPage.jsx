import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import { FiSend, FiArrowLeft } from 'react-icons/fi';

export default function ApplicationFormPage() {
  const { committeeId } = useParams();
  const navigate = useNavigate();
  const [committee, setCommittee] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/committees/${committeeId}`),
      api.get(`/committees/${committeeId}/questions`),
    ])
      .then(([commRes, qRes]) => {
        setCommittee(commRes.data);
        const qs = Array.isArray(qRes.data) ? qRes.data : qRes.data.questions || [];
        setQuestions(qs);
        const initial = {};
        qs.forEach((q, i) => {
          initial[i] = '';
        });
        setAnswers(initial);
      })
      .catch(() => toast.error('Failed to load form'))
      .finally(() => setLoading(false));
  }, [committeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const unanswered = questions.some((q, i) => q.required !== false && !answers[i]?.trim());
    if (unanswered) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('committeeId', committeeId);

      const answerArr = questions.map((q, i) => ({
        question: q.question || q.text || q,
        answer: answers[i] || '',
      }));
      formData.append('answers', JSON.stringify(answerArr));

      if (resume) {
        formData.append('resume', resume);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Application submitted successfully!');
      navigate('/student/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Committee not found.</p>
      </div>
    );
  }

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-800">Apply to {committee.name}</h1>
          <span className="text-sm text-gray-500 capitalize">{committee.type}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, i) => (
            <div key={i}>
              <label className="label">
                {typeof q === 'string' ? q : q.question || q.text}
                {q.required !== false && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={answers[i] || ''}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                rows={4}
                className="input-field resize-y"
                placeholder="Your answer..."
              />
            </div>
          ))}

          {committee.resumeRequired !== false && (
            <FileUpload
              accept=".pdf,.doc,.docx"
              maxSize={5}
              onFileSelect={setResume}
              label="Upload Resume (PDF/DOC)"
            />
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center space-x-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <FiSend />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
