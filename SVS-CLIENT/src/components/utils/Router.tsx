import {
  AuthRequiredRoutes,
  AdminOnlyRoutes,
} from '@/components/utils/ProtectedRoutes';
import AboutPage from '@/pages/AboutPage';
import AdminPage from '@/pages/AdminPage';
import AdminsAdministrationPage from '@/pages/AdminUsersAdministrationPage';
import ContactPage from '@/pages/ContactPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import RegularUsersAdministrationPage from '@/pages/RegularUsersAdministrationPage';
import UsersAdministration from '@/pages/UsersAdministration';
import VoteAdmininstrationPage from '@/pages/VoteAdmininstrationPage';
import VotesAdministrationPage from '@/pages/VotesAdministrationPage';
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
      <Route element={<AdminOnlyRoutes />}>
        <Route path={routes.ADMIN} element={<AdminPage />} />
        <Route
          path={routes.PICK_USERS_ADMINISTRATION}
          element={<UsersAdministration />}
        />
        <Route
          path={routes.USERS_ADMINISTRATION}
          element={<RegularUsersAdministrationPage />}
        />
        <Route
          path={routes.ADMIN_ADMINISTRATION}
          element={<AdminsAdministrationPage />}
        />
        <Route
          path={routes.VOTES_ADMINISTRATION}
          element={<VotesAdministrationPage />}
        />
        <Route
          path={routes.VOTE_ADMINISTRATION}
          element={<VoteAdmininstrationPage />}
        />
      </Route>
      <Route path={routes.RESET_PASSWORD} element={<PasswordResetPage />} />
      <Route path={routes.ABOUT} element={<AboutPage />} />
      <Route path={routes.CONTACT} element={<ContactPage />} />
      <Route path={routes.NOT_ALLOWED} element={<ForbiddenPage />} />
      <Route path={routes.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
