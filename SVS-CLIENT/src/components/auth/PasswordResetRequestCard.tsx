import useAuthActions from '@/components/auth/actions';
import InputWithIcons from '@/components/utils/InputWithIcons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { EmailSchema } from '@/schemas/auth.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideLogIn, LucideUser } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

const PasswordResetRequestCard = () => {
  const { loading, handleSubmitPasswordResetRequestForm } = useAuthActions();
  const form = useForm<{
    email: string;
  }>({
    resolver: zodResolver(EmailSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });
  return (
    <Card className='w-full max-w-md border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm'>
      <CardHeader>
        <CardTitle> Réinitialiser Votre Mot de Passe </CardTitle>
        <CardDescription>
          Réinitialiser Votre mot de passe à l'aide de votre adresse e-mail
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id='reset-password-request-form'
          className='space-y-4'
          onSubmit={form.handleSubmit(handleSubmitPasswordResetRequestForm)}
        >
          <Controller
            name='email'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className='space-y-1' aria-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='email'>Adresse e-mail</FieldLabel>
                <InputWithIcons
                  LeftIcon={LucideUser}
                  icon_props={{
                    className: fieldState.invalid
                      ? 'text-destructive'
                      : undefined,
                  }}
                  input_props={{
                    id: 'email',
                    type: 'email',
                    'aria-invalid': fieldState.invalid,
                    ...field,
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </form>
      </CardContent>

      <CardFooter className='flex justify-center items-center'>
        <Button
          type='submit'
          className='w-fit hover:scale-105 transition-transform'
          disabled={loading.resetPasswordRequestButton}
          form='reset-password-request-form'
        >
          {loading.resetPasswordRequestButton ? (
            <>
              <Spinner className='mr-2' />
              Envoie...
            </>
          ) : (
            <>
              <LucideLogIn className='mr-2' />
              Envoyer
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PasswordResetRequestCard;
