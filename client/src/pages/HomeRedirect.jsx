import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/ui/Loader.jsx';

const HOME_BY_ROLE = {
  student: <Navigate to="/student" replace />,
  cca: <Navigate to="/cca" replace />,
  panelist: <Navigate to="/panelist" replace />,
  senate: <Navigate to="/senate" replace />,
};

export default function HomeRedirect() {
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

  return HOME_BY_ROLE[account.role];
}
