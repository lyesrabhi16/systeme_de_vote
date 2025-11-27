import useAuth from '@/hooks/useAuth';
import { routes } from '@/services/routing';
import { Navigate, Outlet } from 'react-router';

const AuthRequiredRoutes = () => {
  const { is_authenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!is_authenticated()) {
    return <Navigate to={routes.LOGIN} replace />;
  }
  // Render children if authenticated
  return <Outlet />;
};

export default AuthRequiredRoutes;
