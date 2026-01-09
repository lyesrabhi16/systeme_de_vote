import { routes } from '@/services/routing';
import useGlobalStore from '@/services/store';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

export const AuthRequiredRoutes = () => {
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

export const AdminOnlyRoutes = () => {
  const { user, token } = useGlobalStore();
  const navigate = useNavigate();

  // Redirect to Not Allowed Page if not admin
  useEffect(() => {
    if (user === null || token === null || !user.is_admin) {
      console.log('not authorized redirecting to not allowed page', user, token);
      navigate(routes.NOT_ALLOWED, { replace: true });
    } else {
      console.log('authorized proceeding to admin route', user, token);
    }
  }, [user, token]);

  // Render children if authorized
  return <Outlet />;
};
