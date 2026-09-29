import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';

export default function LogoutButton(props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleClick() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Button variant="plain" size="sm" onClick={handleClick} {...props}>
      Log out
    </Button>
  );
}
