import { routes } from '@/services/routing';
import useGlobalStore from '@/services/store';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

const AuthRequiredRoutes = () => {
  const { user, token } = useGlobalStore();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null || token === null) {
      console.log('not authenticated redirecting to login', user, token);
      navigate(routes.LOGIN, { replace: true });
    } else {
      console.log('authenticated proceeding to protected route', user, token);
    }
  }, [user, token]);

  // Render children if authenticated
  return <Outlet />;
};

export default AuthRequiredRoutes;
