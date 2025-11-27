import AlreadyLoggedInCard from '@/components/auth/AlreadyLoggedInCard';
import logo from '/logo.png';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import useAuth from '@/hooks/useAuth';
import { LucideLockKeyhole, LucideLogIn, LucideUser } from 'lucide-react';
import { LoginFormSchema } from '@schemas/auth.schemas';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type z from 'zod';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import InputWithIcons from '@/components/utils/InputWithIcons';
import useAuthActions from '@/components/auth/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router';
import { routes } from '@/services/routing';

const LoginCard = () => {
  const auth = useAuth();
  const { loading, handleSubmitLoginForm } = useAuthActions();

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
    },
  });

  if (auth.is_authenticated()) {
    return <AlreadyLoggedInCard />;
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle className='text-3xl font-bold text-center flex flex-col flex-nowrap gap-2 items-center w-full'>
          <img src={logo} alt='Logo' />
          <h1>Connectez-vous Pour Voter</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id='login-form'
          onSubmit={form.handleSubmit(handleSubmitLoginForm)}
        >
          <FieldGroup>
            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='email'>
                    Adresse mail / numero de telephone
                  </FieldLabel>
                  <InputWithIcons
                    LeftIcon={LucideUser}
                    icon_props={{
                      className: fieldState.invalid
                        ? 'text-destructive'
                        : undefined,
                    }}
                    input_props={{
                      ...field,
                      'aria-invalid': fieldState.invalid,
                      id: 'email',
                      /* type:
                          data.IdentifierType === IdentifierType.Email
                            ? 'email'
                            : 'tel',
                         */ placeholder: 'Adresse email',
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel
                    htmlFor='password'
                    className='flex flex-row flex-wrap justify-content-between items-center'
                  >
                    <p>Mot de passe</p>
                    <Link
                      to={routes.RESET_PASSWORD}
                      className='text-muted-foreground text-sm ml-auto hover:underline'
                    >
                      Mot de passe oublié ?
                    </Link>
                  </FieldLabel>
                  <InputWithIcons
                    LeftIcon={LucideLockKeyhole}
                    icon_props={{
                      className: fieldState.invalid
                        ? 'text-destructive'
                        : undefined,
                    }}
                    input_props={{
                      ...field,
                      id: 'password',
                      type: 'password',
                      placeholder: 'Mot de passe',
                      'aria-invalid': fieldState.invalid,
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name='remember_me'
              control={form.control}
              render={({ field }) => (
                <div className='flex flex-row flex-nowrap items-end justify-content-end w-full space-x-2'>
                  <Checkbox
                    id='remember_me'
                    className='ms-auto w-4 h-4 rounded border bg-background focus:ring-2 focus:ring-primary'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor='remember_me' className='mb-0'>
                    Se souvenir de moi
                  </Label>
                </div>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Button
          type='submit'
          className='w-fit hover:scale-105 transition-transform'
          disabled={loading.loginButton}
          form='login-form'
        >
          {loading.loginButton ? (
            <>
              <Spinner className='mr-2' />
              Connexion...
            </>
          ) : (
            <>
              <LucideLogIn className='mr-2' />
              Se connecter
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoginCard;
