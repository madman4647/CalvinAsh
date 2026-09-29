import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';

export default function SenateHome() {
  const { account } = useAuth();

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Senate - {account.loginId}</h1>
        <LogoutButton quiet />
      </div>
      <div className="dense-panel p-6 flex flex-col gap-3">
        <p>The control centre (dashboards, audit log viewer) arrives from Loop 5 onward. For now:</p>
        <div className="flex gap-3">
          <Link to="/senate/students/import">
            <Button variant="accent" size="sm" quiet>Import students</Button>
          </Link>
          <Link to="/senate/ccas">
            <Button variant="accent" size="sm" quiet>Create a CCA</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
