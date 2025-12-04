import AuthRequiredRoutes from '@/components/utils/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import VotingPage from '@/pages/VotingPage';
import { routes } from '@/services/routing';
import { Route, Routes } from 'react-router';

const Router = () => {
  return (
    <Routes>
      <Route element={<AuthRequiredRoutes />}>
        <Route path={routes.HOME} element={<HomePage />} />
        <Route path={routes.VOTE} element={<VotingPage />} />
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
