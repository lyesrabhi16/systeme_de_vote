import AuthLayout from '@/components/auth/AuthLayout';
import PasswordResetCard from '@/components/auth/PasswordResetCard';
import PasswordResetRequestCard from '@/components/auth/PasswordResetRequestCard';

const PasswordResetPage = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const uid = queryParams.get('uid');
  const otp = queryParams.get('otp');
  if (uid && otp) {
    return (
      <AuthLayout>
        <PasswordResetCard uid={uid} otp={otp} />
      </AuthLayout>
    );
  }
  return (
    <AuthLayout>
      <PasswordResetRequestCard />
    </AuthLayout>
  );
};

export default PasswordResetPage;
