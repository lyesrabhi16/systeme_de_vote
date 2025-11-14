import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import { routes } from '@/services/routing';
import useGlobalStore from '@/services/store';
import { Route, Routes } from 'react-router';

const Router = () => {
  const store = useGlobalStore();
  const auth = useAuth();

  return (
    <Routes>
      <Route
        middleware={[
          (d) => {
            console.log('Middleware check for home route', d);
          },
        ]}
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
      <Route path={routes.LOGIN} element={<LoginPage />} />
      <Route path={routes.NOT_FOUND} element={<>Not Found</>} />
    </Routes>
  );
};

export default Router;
