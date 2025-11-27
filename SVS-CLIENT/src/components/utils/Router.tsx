import { Button } from '@/components/ui/button';
import AuthRequiredRoutes from '@/components/utils/ProtectedRoute';
import useAuth from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import { routes } from '@/services/routing';
import useGlobalStore from '@/services/store';
import { Route, Routes } from 'react-router';

const Router = () => {
  const store = useGlobalStore();
  const auth = useAuth();
  return (
    <Routes>
      <Route element={<AuthRequiredRoutes />}>
        <Route
          path={routes.HOME}
          element={
            <>
              {(store.user && (
                <>
                  <p>Welcome back, {store.user.username}! Page: Home</p>
                  <Button onClick={() => auth.logout()}>Logout</Button>
                </>
              )) || <p>HomePage</p>}
            </>
          }
        />
      </Route>
      <Route path={routes.LOGIN}>
        <Route index element={<LoginPage />} />
        <Route
          path={`${routes.OTP_VERIFICATION}/:user_id`}
          element={<OTPVerificationPage />}
        />
      </Route>
      <Route path={routes.RESET_PASSWORD} element={<PasswordResetPage />} />
      <Route path={routes.NOT_FOUND} element={<>Not Found</>} />
    </Routes>
  );
};

export default Router;
