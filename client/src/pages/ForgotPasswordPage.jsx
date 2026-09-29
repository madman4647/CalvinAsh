import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [pgpId, setPgpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pgpId.trim()) {
      toast.error('Please enter your PGP ID');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { pgpId: pgpId.trim() });
      setSubmitted(true);
      toast.success('Password reset request submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Calvin</h1>
          <p className="text-gold-400 text-lg italic">Express your Interests...Online</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-primary-800 mb-6 text-center">Reset Password</h2>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FiSend className="text-green-600 text-2xl" />
              </div>
              <p className="text-gray-600">
                Your password reset request has been submitted. You will receive your new password via email shortly.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center space-x-2">
                <FiArrowLeft />
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="pgpId" className="label">PGP ID</label>
                <input
                  id="pgpId"
                  type="text"
                  value={pgpId}
                  onChange={(e) => setPgpId(e.target.value)}
                  placeholder="e.g., PGP40001"
                  className="input-field"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <FiSend />
                    <span>Submit Request</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-800 hover:underline flex items-center justify-center space-x-1">
                  <FiArrowLeft size={14} />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-primary-300 text-sm mt-8">
          IIM Lucknow &middot; Team SynapsE
        </p>
      </div>
    </div>
  );
}
