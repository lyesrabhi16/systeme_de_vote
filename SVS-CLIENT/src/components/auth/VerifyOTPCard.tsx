import { useAuthActions } from '@/components/auth/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useEffect, useState } from 'react';

const VerifyOTPCard = (props: { id: string }) => {
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const {
    resendButtonState,
    handleSubmitOtpVerificationForm,
    handleResendCode,
    getMaskedEmail,
    setResendButtonState,
  } = useAuthActions({
    resendButtonState: {
      disabled: true,
      text: 'Renvoyez le code',
      timer: 60,
    },
  });

  // Resend button timer effect
  useEffect(() => {
    let timer: number;
    if (resendButtonState.disabled) {
      timer = setInterval(() => {
        setResendButtonState((prevState) => ({
          ...prevState,
          timer: prevState.timer - 1,
          text: `Renvoyez le code (${prevState.timer - 1}s)`,
        }));
        if (resendButtonState.timer <= 0) {
          clearInterval(timer);
          setResendButtonState({
            disabled: false,
            text: 'Renvoyez le code',
            timer: 0,
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  // Get masked email from store on component mount
  useEffect(() => {
    const email = getMaskedEmail();
    setMaskedEmail(email);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifier le code OTP</CardTitle>
        <CardDescription>
          Entrez le code à 6 chiffres envoyé à votre e-mail :{' '}
          <p className='text-primary font-medium block text-center mt-2'>
            {maskedEmail}
          </p>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className='space-y-4'
          onSubmit={(e) =>
            handleSubmitOtpVerificationForm(e, { id: props.id, otp: otp })
          }
        >
          <div className='flex gap-2 flex-col flex-nowrap justify-center items-center'>
            <label htmlFor='otp' className='sr-only'>
              One-time password
            </label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(nv) => setOtp(nv.toUpperCase())}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className='flex flex-col items-center justify-between mt-4'>
            <Button type='submit'>Verifier</Button>
          </div>
        </form>

        <p className='mt-3 text-xs text-muted-foreground'>
          Vous n'avez pas reçu le code ? Vérifiez votre dossier spam ou{' '}
          <Button
            variant='link'
            className='p-0 m-0'
            onClick={() => handleResendCode({ id: props.id })}
            disabled={resendButtonState.disabled}
          >
            {resendButtonState.text}
          </Button>
        </p>
      </CardContent>

      <CardFooter className='pt-0' />
    </Card>
  );
};

export default VerifyOTPCard;
