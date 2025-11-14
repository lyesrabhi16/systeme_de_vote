import LoginCard from '@/components/auth/LoginCard';
import useAuth from '@/hooks/useAuth';
import { useNavigate } from 'react-router';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  if (auth.is_authenticated()) {
    navigate('/');
  }

  return (
    <div className='w-full flex min-h-screen items-center justify-center bg-muted'>
      <LoginCard />
    </div>
  );
};

export default LoginPage;
