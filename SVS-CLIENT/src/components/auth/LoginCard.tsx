import { IdentifierType } from '@/api/sdk';
import AlreadyLoggedInCard from '@/components/auth/AlreadyLoggedInCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import useAuth from '@/hooks/useAuth';
import { LucideLockKeyhole, LucideLogIn, LucideUser } from 'lucide-react';
import { useState } from 'react';

const LoginCard = () => {
  const auth = useAuth();
  const [data, setData] = useState({
    identifier: '',
    password: '',
    IdentifierType: IdentifierType.Email as IdentifierType,
  });

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let type: IdentifierType = IdentifierType.Email;

    // Simple check to see if the input is a phone number
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phoneRegex.test(value)) {
      type = IdentifierType.PhoneNumber;
    }

    setData({
      ...data,
      identifier: value,
      IdentifierType: type,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    auth
      .login({
        identifier: data.identifier,
        password: data.password,
        identifier_type: data.IdentifierType,
      })
      .then((response) => {
        if (response === null) {
          console.error('Login failed: No response data');
          return;
        }
        console.log('Login successful:', response);
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  if (auth.is_authenticated()) {
    return <AlreadyLoggedInCard />;
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle className='text-3xl font-bold text-center flex flex-col flex-nowrap gap-2 items-center w-full'>
          <img src='/logo.png' alt='Logo' />
          <h1>Connectez-vous Pour Voter</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className='flex flex-col gap-6'>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Adresse mail / numero de telephone</Label>
              <InputGroup>
                <InputGroupAddon>
                  <LucideUser className='text-muted-foreground' />
                </InputGroupAddon>
                <InputGroupInput
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                  value={data.identifier}
                  onChange={handleIdentifierChange}
                />
              </InputGroup>
            </div>
            <div className='grid gap-2'>
              <div className='flex items-center'>
                <Label htmlFor='password'>Mot de passe</Label>
                <a
                  href='#'
                  className='text-muted-foreground text-sm ml-auto hover:underline'
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <InputGroup>
                <InputGroupAddon>
                  <LucideLockKeyhole className='text-muted-foreground' />
                </InputGroupAddon>
                <InputGroupInput
                  id='password'
                  type='password'
                  required
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                />
              </InputGroup>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Button
          type='submit'
          onClick={handleSubmit}
          className='w-fit hover:scale-105 transition-transform'
        >
          <LucideLogIn /> Se Connecter
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoginCard;
