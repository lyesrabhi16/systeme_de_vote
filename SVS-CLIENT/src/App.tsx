import useGlobalStore from '@/services/store';
import useAuth from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import LoadingPage from '@/pages/LoadingPage';
import Router from '@/components/utils/Router';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AppWrapper />;
    </QueryClientProvider>
  );
}

const AppWrapper = () => {
  const store = useGlobalStore();
  const auth = useAuth();
  const [loaded, setLoaded] = useState(false);

  const loadUser = () => {
    if (!store.user) {
      auth
        .load_current_user()
        .then((user) => {
          if (user === null) {
            //console.log('No user loaded, logging out');
            auth.logout();
          } else {
            //console.log('Loaded current user:', user);
          }
        })
        .catch(async (e) => {
          console.error('Failed to load user:', e);
          auth.logout();
        })
        .finally(() => {
          setLoaded(true);
        });
    }
  };

  useEffect(() => {
    loadUser();
  }, [store.user]);

  if (!loaded) {
    return <LoadingPage />;
  }
  return (
    <div className='flex flex-col min-h-screen items-center justify-center p-0 m-0'>
      <Router />
      <Toaster position='bottom-right' richColors closeButton />
    </div>
  );
};

export default App;
