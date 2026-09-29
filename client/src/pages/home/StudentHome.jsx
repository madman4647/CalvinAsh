import { useAuth } from '../../context/AuthContext.jsx';
import ComicPanel from '../../components/ui/ComicPanel.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';

export default function StudentHome() {
  const { account } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <ComicPanel className="max-w-md w-full flex flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-2xl">Hey, {account.loginId}!</h1>
        <p>CCAs to browse and apply to are coming soon.</p>
        <LogoutButton />
      </ComicPanel>
    </main>
  );
}
