import useAuthActions from '@/components/auth/actions';
import InputWithIcons from '@/components/utils/InputWithIcons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  PasswordResetSchema,
  type PasswordResetSchemaType,
} from '@/schemas/auth.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideLockKeyhole, LucideLogIn } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

const PasswordResetCard = (props: { uid: string; otp: string }) => {
  const { loading, handleSubmitPasswordResetForm } = useAuthActions();
  const form = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema),
    mode: 'onChange',
    defaultValues: {
      password1: '',
      password2: '',
    },
  });
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle className='text-3xl font-bold text-center flex flex-col flex-nowrap gap-2 items-center w-full'>
          <img src='/logo.png' alt='Logo' />
          <h1>Saisir un nouveau mot de passe</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id='password-reset-form'
          onSubmit={form.handleSubmit((d) =>
            handleSubmitPasswordResetForm({
              id: props.uid,
              otp: props.otp,
              password: d.password1,
            }),
          )}
        >
          <FieldGroup>
            <Controller
              name='password1'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='password1'>
                    Nouveau mot de passe
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
                      'aria-invalid': fieldState.invalid,
                      type: 'password',
                      id: 'password1',
                      /* type:
                          data.IdentifierType === IdentifierType.Email
                            ? 'email'
                            : 'tel',
                         */ placeholder: 'Mot de passe',
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='password2'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel
                    htmlFor='password'
                    className='flex flex-row flex-wrap justify-content-between items-center'
                  >
                    <p>Confirmer le nouveau mot de passe</p>
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
                      id: 'password2',
                      type: 'password',
                      placeholder: 'Confirmer le nouveau mot de passe',
                      'aria-invalid': fieldState.invalid,
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Button
          type='submit'
          className='w-fit hover:scale-105 transition-transform'
          disabled={loading.passwordResetButton}
          form='password-reset-form'
        >
          {loading.passwordResetButton ? (
            <>
              <Spinner className='mr-2' />
              Réinitialisation...
            </>
          ) : (
            <>
              <LucideLogIn className='mr-2' />
              Réinitialiser
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PasswordResetCard;
