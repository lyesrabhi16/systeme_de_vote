import VerifyOTPCard from '@/components/auth/VerifyOTPCard';
import { useParams } from 'react-router';

const OTPVerificationPage = () => {
  const params = useParams();
  const id = params.user_id as string;
  return (
    <div className='w-full flex min-h-screen items-center justify-center bg-muted'>
      <VerifyOTPCard id={id} />
    </div>
  );
};

export default OTPVerificationPage;
