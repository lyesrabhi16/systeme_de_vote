import LoginCard from '@/components/auth/LoginCard';
import useAuth from '@/hooks/useAuth';
import { useNavigate } from 'react-router';
import { routes } from '@/services/routing';
const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  if (auth.is_authenticated()) {
    navigate(routes.HOME);
  }

  return (
    <div className='w-full flex min-h-screen items-center justify-center'>
      <LoginCard />
    </div>
  );
};

export default LoginPage;
