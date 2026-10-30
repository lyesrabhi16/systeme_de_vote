import AuthLayout from '@/components/auth/AuthLayout';
import VerifyOTPCard from '@/components/auth/VerifyOTPCard';
import { useParams } from 'react-router';

const OTPVerificationPage = () => {
  const params = useParams();
  const id = params.user_id as string;
  return (
    <AuthLayout>
      <VerifyOTPCard id={id} />
    </AuthLayout>
  );
};

export default OTPVerificationPage;
