import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './ui/Loader.jsx';

export default function RequireRole({ role, children }) {
  const { account, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(account.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
