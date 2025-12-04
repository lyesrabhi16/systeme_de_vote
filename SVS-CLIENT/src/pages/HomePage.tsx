import AvailableVotes from '@/components/home/AvailableVotes';
import FinishedVotes from '@/components/home/FinishedVotes';
import AppContainer from '@/components/utils/AppContainer';
import useAuth from '@/hooks/useAuth';
import { getUserName } from '@/utils/user.utils';



const HomePage = () => {
  const { user } = useAuth();
  return (
    <AppContainer>
      <div className='flex flex-col gap-4 px-8 py-2 mt-0 w-full justify-center items-start'>
        <h1 className='text-3xl font-bold'>Bienvenue, {getUserName(user)}</h1>
        <AvailableVotes />
        <FinishedVotes />
      </div>
    </AppContainer>
  );
};

export default HomePage;
