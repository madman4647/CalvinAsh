import { useState, useEffect } from 'react';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';

export default function CommonQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [resume, setResume] = useState(null);
  const [existingAnswers, setExistingAnswers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/common-questions'),
      api.get('/common-questions/my-answers').catch(() => ({ data: null })),
    ])
      .then(([qRes, aRes]) => {
        const qs = Array.isArray(qRes.data) ? qRes.data : qRes.data.questions || [];
        setQuestions(qs);

        if (aRes.data && aRes.data.answers) {
          setExistingAnswers(aRes.data);
          const initial = {};
          qs.forEach((q, i) => {
            const existing = aRes.data.answers.find(
              (a) => a.question === (q.question || q.text || q)
            );
            initial[i] = existing ? existing.answer : '';
          });
          setAnswers(initial);
        } else {
          const initial = {};
          qs.forEach((_, i) => { initial[i] = ''; });
          setAnswers(initial);
        }
      })
      .catch(() => toast.error('Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      const answerArr = questions.map((q, i) => ({
        question: typeof q === 'string' ? q : q.question || q.text,
        answer: answers[i] || '',
      }));
      formData.append('answers', JSON.stringify(answerArr));
      if (resume) {
        formData.append('resume', resume);
      }
      await api.post('/common-questions/answers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Answers saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save answers');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <h1 className="mb-2">Common Questions</h1>
      <p className="text-gray-500 mb-6">
        These answers will be shared with all CCAs you apply to.
      </p>

      <div className="card">
        <div className="space-y-6">
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No common questions available.</p>
          ) : (
            questions.map((q, i) => (
              <div key={i}>
                <label className="label">
                  {typeof q === 'string' ? q : q.question || q.text}
                </label>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  rows={4}
                  className="input-field resize-y"
                  placeholder="Your answer..."
                />
              </div>
            ))
          )}

          <FileUpload
            accept=".pdf,.doc,.docx"
            maxSize={5}
            onFileSelect={setResume}
            label="Upload General Resume"
          />

          {existingAnswers?.resumeUrl && (
            <p className="text-sm text-gray-500">
              Previously uploaded resume:{' '}
              <a href={existingAnswers.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                View
              </a>
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-end">
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
                <span>Save Answers</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
