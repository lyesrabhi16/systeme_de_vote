import useGlobalStore from '@/services/store';
import useAuth from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import LoadingPage from '@/pages/LoadingPage';
import Router from '@/components/utils/Router';
import { Toaster } from 'sonner';
function App() {
  const store = useGlobalStore();
  const auth = useAuth();
  const [loaded, setLoaded] = useState(false);

  const loadUser = () => {
    if (!store.user) {
      auth
        .loadCurrentUser()
        .catch((e) => {
          console.error('Failed to load user:', e);
        })
        .finally(() => {
          setLoaded(true);
        });
    }
  };

  useEffect(() => {
    loadUser();
  });

  if (!loaded) {
    return <LoadingPage />;
  }
  return (
    <div className='flex flex-col min-h-screen items-center justify-center p-0 m-0'>
      <Router />
      <Toaster position='bottom-right' richColors closeButton />
    </div>
  );
}

export default App;
