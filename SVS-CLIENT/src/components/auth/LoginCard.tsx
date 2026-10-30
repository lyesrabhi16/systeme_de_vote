import AlreadyLoggedInCard from '@/components/auth/AlreadyLoggedInCard';
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
      password: undefined,
      remember_me: false,
    },
  });

  if (auth.is_authenticated()) {
    return <AlreadyLoggedInCard />;
  }

  return (
    <Card className='w-full max-w-md border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm'>
      <CardHeader>
        <CardTitle className='text-center text-3xl font-semibold'>
          <h1>Connexion</h1>
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
                    Adresse e-mail
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
      <CardFooter className='flex-col gap-3'>
        <Button
          type='submit'
          className='w-full'
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
