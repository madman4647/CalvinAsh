import { useState, useEffect } from 'react';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function FormEditorPage() {
  const [committee, setCommittee] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [maxCandidates, setMaxCandidates] = useState('');
  const [resumeRequired, setResumeRequired] = useState(true);
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/committees/my')
      .then(async (res) => {
        const comm = res.data;
        setCommittee(comm);
        setDeadline(comm.deadline ? new Date(comm.deadline).toISOString().slice(0, 16) : '');
        setMaxCandidates(comm.maxCandidates || '');
        setResumeRequired(comm.resumeRequired !== false);

        try {
          const qRes = await api.get(`/committees/${comm._id}/questions`);
          const qs = Array.isArray(qRes.data) ? qRes.data : qRes.data.questions || [];
          setQuestions(qs.map((q) => (typeof q === 'string' ? q : q.question || q.text || '')));
        } catch {
          setQuestions([]);
        }
      })
      .catch(() => toast.error('Failed to load form settings'))
      .finally(() => setLoading(false));
  }, []);

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error('Maximum 10 questions allowed');
      return;
    }
    setQuestions([...questions, '']);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setQuestions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('questions', JSON.stringify(questions.filter((q) => q.trim())));
      formData.append('deadline', deadline);
      formData.append('maxCandidates', maxCandidates);
      formData.append('resumeRequired', resumeRequired);
      if (presentation) {
        formData.append('presentation', presentation);
      }
      await api.put(`/committees/${committee._id}/settings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
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
      <h1 className="mb-6">Edit Application Form</h1>

      <div className="space-y-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">Custom Questions</h2>
          <p className="text-sm text-gray-500 mb-4">Add up to 10 questions for applicants ({questions.length}/10)</p>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-400 mt-2.5 w-6">{i + 1}.</span>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[i] = e.target.value;
                    setQuestions(updated);
                  }}
                  placeholder="Enter question..."
                  className="input-field flex-1"
                />
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveQuestion(i, -1)}
                    disabled={i === 0}
                    className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"
                  >
                    <FiArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveQuestion(i, 1)}
                    disabled={i === questions.length - 1}
                    className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"
                  >
                    <FiArrowDown size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeQuestion(i)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            disabled={questions.length >= 10}
            className="mt-4 btn-outline text-sm flex items-center space-x-1"
          >
            <FiPlus />
            <span>Add Question</span>
          </button>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Application Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Max Candidates to Select</label>
              <input
                type="number"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(e.target.value)}
                min="1"
                className="input-field"
                placeholder="e.g., 20"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resumeRequired}
                onChange={(e) => setResumeRequired(e.target.checked)}
                className="w-4 h-4 text-primary-800 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Require resume upload from applicants</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">Presentation</h2>
          <FileUpload
            accept=".pdf,.ppt,.pptx"
            maxSize={20}
            onFileSelect={setPresentation}
            label="Upload Presentation File"
          />
          {committee?.presentationUrl && (
            <p className="text-sm text-gray-500 mt-2">
              Current:{' '}
              <a href={committee.presentationUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                View existing presentation
              </a>
            </p>
          )}
        </div>

        <div className="flex justify-end">
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
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
