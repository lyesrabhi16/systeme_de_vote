import LoginCard from '@/components/auth/LoginCard';
import useAuth from '@/hooks/useAuth';
import { useNavigate } from 'react-router';
import { routes } from '@/services/routing';
import { useEffect } from 'react';
const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.is_authenticated()) {
      navigate(routes.HOME);
    }
  }, [auth]);

  return (
    <div className='w-full flex min-h-screen items-center justify-center'>
      <LoginCard />
    </div>
  );
};

export default LoginPage;
