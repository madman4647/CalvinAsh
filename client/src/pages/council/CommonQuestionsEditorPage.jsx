import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiPlus, FiTrash2, FiHelpCircle } from 'react-icons/fi';

export default function CommonQuestionsEditorPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/council/common-questions')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.questions || [];
        setQuestions(data.map((q) => (typeof q === 'string' ? q : q.text || q.question || '')));
      })
      .catch(() => toast.error('Failed to load common questions'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    if (questions.length >= 10) {
      toast.error('Maximum 10 common questions allowed');
      return;
    }
    setQuestions((prev) => [...prev, '']);
  };

  const handleRemove = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? value : q)));
  };

  const handleSave = async () => {
    const trimmed = questions.map((q) => q.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      toast.error('Add at least one question before saving');
      return;
    }
    setSaving(true);
    try {
      await api.put('/council/common-questions', { questions: trimmed });
      toast.success('Common questions saved!');
      setQuestions(trimmed);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: 'var(--ch-red)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '48rem' }}>
      <div className="flex items-center gap-3 mb-2">
        <FiHelpCircle style={{ fontSize: '1.75rem', color: 'var(--ch-red)' }} />
        <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: '2.25rem', color: 'var(--ch-red)' }}>
          Common Questions
        </h1>
      </div>
      <p className="text-sm font-semibold mb-8" style={{ color: 'var(--ch-ink)', opacity: 0.55 }}>
        These questions appear on every student application regardless of CCA. Maximum 10 questions.
      </p>

      <div className="comic-card mb-6">
        <div className="space-y-4">
          {questions.length === 0 && (
            <p className="text-sm font-semibold text-center py-4" style={{ color: 'var(--ch-ink)', opacity: 0.45 }}>
              No common questions yet. Add one below.
            </p>
          )}

          {questions.map((q, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span
                style={{
                  flexShrink: 0,
                  width: '1.75rem',
                  height: '1.75rem',
                  background: 'var(--ch-gold)',
                  color: '#ffffff',
                  border: '2px solid var(--ch-ink)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  fontFamily: "'Bangers', cursive",
                  marginTop: '0.35rem',
                }}
              >
                {idx + 1}
              </span>
              <input
                type="text"
                value={q}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder={`Question ${idx + 1}`}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => handleRemove(idx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ch-red)',
                  marginTop: '0.35rem',
                  flexShrink: 0,
                }}
                title="Remove question"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {questions.length < 10 && (
          <button
            className="btn-calvin-outline mt-5 text-sm px-4 py-2"
            onClick={handleAdd}
          >
            <FiPlus />
            <span>Add Question</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          className="btn-calvin"
          style={{ fontSize: '1rem', padding: '0.65rem 1.75rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave />
          <span>{saving ? 'Saving...' : 'Save Questions'}</span>
        </button>
        <span className="text-xs font-semibold" style={{ color: 'var(--ch-ink)', opacity: 0.45 }}>
          {questions.length} / 10 questions
        </span>
      </div>
    </div>
  );
}
