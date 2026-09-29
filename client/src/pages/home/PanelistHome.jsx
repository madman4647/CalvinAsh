import { useAuth } from '../../context/AuthContext.jsx';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';

export default function PanelistHome() {
  const { account } = useAuth();

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Welcome, {account.loginId}</h1>
        <LogoutButton />
      </div>
      <ComicPanel variant="quiet">
        <p>Your task queue and interview console arrive in later loops.</p>
      </ComicPanel>
    </main>
  );
}
