import PasswordResetCard from '@/components/auth/PasswordResetCard';
import PasswordResetRequestCard from '@/components/auth/PasswordResetRequestCard';

const PasswordResetPage = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const uid = queryParams.get('uid');
  const otp = queryParams.get('otp');
  if (uid && otp) {
    return <PasswordResetCard uid={uid} otp={otp} />;
  }
  return <PasswordResetRequestCard />;
};

export default PasswordResetPage;
