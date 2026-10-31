import AvailableVotes from '@/components/home/AvailableVotes';
import FinishedVotes from '@/components/home/FinishedVotes';
import AppContainer from '@/components/utils/AppContainer';
import useAuth from '@/hooks/useAuth';
import { getUserName } from '@/utils/user.utils';

const HomePage = () => {
  const { user } = useAuth();
  return (
    <AppContainer noBreadcrumbs>
      <div className='flex flex-col gap-12 pt-6'>
        <div>
          <h1 className='text-3xl font-semibold sm:text-4xl'>Bonjour, {getUserName(user)}</h1>
          <p className='mt-2 max-w-2xl text-muted-foreground'>
            Votre bulletin est chiffré dans votre navigateur avant d'être envoyé. Vous recevez un reçu pour le retrouver sur le tableau d'affichage public, et chacun peut vérifier le décompte.
          </p>
        </div>
        <AvailableVotes />
        <FinishedVotes />
      </div>
    </AppContainer>
  );
};

export default HomePage;
