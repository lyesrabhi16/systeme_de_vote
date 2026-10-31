import type { UserCreationModelAuthorityEnum } from '@/api/sdk';
import { routes } from '@/services/routing';
import useGlobalStore from '@/services/store';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

export const AuthRequiredRoutes = () => {
  const { user } = useGlobalStore();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      //console.log('not authenticated redirecting to login', user);
      navigate(routes.LOGIN, { replace: true });
    } else {
      //console.log('authenticated proceeding to protected route', user);
    }
  }, [user]);

  // Render children if authenticated
  return <Outlet />;
};

export const AdminOnlyRoutes = () => {
  const { user } = useGlobalStore();
  const navigate = useNavigate();

  // Redirect to Not Allowed Page if not admin
  useEffect(() => {
    if (user === null || !user.is_admin) {
      //console.log('not authorized redirecting to not allowed page', user);
      navigate(routes.NOT_ALLOWED, { replace: true });
    } else {
      //console.log('authorized proceeding to admin route', user);
    }
  }, [user]);

  // Render children if authorized
  return <Outlet />;
};

export const WithAuthorityOnlyRoutes = (props: {
  requiredAuthority: UserCreationModelAuthorityEnum;
}) => {
  const { user } = useGlobalStore();
  const navigate = useNavigate();

  // Redirect to Not Allowed Page if not admin
  useEffect(() => {
    if (
      user === null ||
      user.authority !== props.requiredAuthority
    ) {
      //console.log('not authorized redirecting to not allowed page', user);
      navigate(routes.NOT_ALLOWED, { replace: true });
    } else {
      //console.log('authorized proceeding to admin route', user);
    }
  }, [user]);

  // Render children if authorized
  return <Outlet />;
};
