import { Spinner } from '@/components/ui/spinner';

const LoadingPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <Spinner className='size-8' />
    </div>
  );
};

export default LoadingPage;
