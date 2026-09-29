import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import Button from '../../components/ui/Button.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';

export default function CcaHome() {
  const { account } = useAuth();

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">CCA HQ - {account.loginId}</h1>
        <LogoutButton />
      </div>
      <ComicPanel variant="quiet" className="flex flex-col gap-3">
        <p>Structure, rounds and panels are coming in later loops. For now:</p>
        <Link to="/cca/panelists">
          <Button variant="accent">Manage panelists</Button>
        </Link>
      </ComicPanel>
    </main>
  );
}
