import apiClient, { ERROR_CODES } from '@/api/client';
import {
  AuthorityEnum,
  UserCreationModelAuthorityEnum,
  type User,
  type UserResponseModel,
  type UserUpdateModel,
} from '@/api/sdk';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import UserAuthorityTypeBadge from '@/components/users/AdminAuthorityTypeBadge';
import ActionBadge from '@/components/utils/ActionBadge';
import CheckBadge from '@/components/utils/CheckBadge';
import SectionHeader from '@/components/utils/SectionHeader';
import UserAvatarWithUserName from '@/components/utils/UserAvatarWithUserName';
import { AdminUserFormSchema, UserFormSchema } from '@/schemas/user.schemas';
import { UserFormModalTypes } from '@/utils/user.utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LucidePenBox,
  LucideX,
  LucideUser,
  LucideMail,
  LucideLockKeyhole,
  LucideRefreshCcw,
  LucideCheck,
  LucideUserPlus,
} from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { toast, useSonner } from 'sonner';
import type z from 'zod';

type doneStateType = {
  state: boolean;
  success: boolean | null;
};

const UserFormModal = (props: {
  user?: User;
  type: keyof typeof UserFormModalTypes | undefined;
  trigger?: React.ReactNode;
  content_only?: boolean;
  open?: boolean;
  onOpenChange?: (
    open: boolean,
    defaultSetOpen?: Dispatch<SetStateAction<boolean>>,
  ) => void;
  admin?: boolean;
}) => {
  const { toasts } = useSonner();

  const [user, setUser] = useState({
    old: props.user,
    ...props.user,
  });
  const [manualPassword, setManualPassword] = useState(false);
  const [loading, setLoading] = useState({
    form: false,
    resetPassword: false,
    sendVerificationEmail: false,
  });
  const [done, setDone] = useState<Record<string, doneStateType>>({
    resetPassword: {
      state: true,
      success: null,
    },
    sendVerificationEmail: {
      state: true,
      success: null,
    },
  });

  const [open, setOpen] = useState(false);
  const onOpenChange =
    props.onOpenChange !== undefined
      ? (open: boolean) => props.onOpenChange?.(open, setOpen)
      : setOpen;

  const [formType, setFormtype] = useState(props.type || 'default');

  const userForm = useForm<z.infer<typeof UserFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      id: user.id || undefined,
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      is_active: user.is_active || false,
      is_admin: user.is_admin || false,
      verified_email: user.verified_email || false,
      verified_phone_number: user.verified_phone_number || false,
      password: user.password || '',
    },
  });
  const adminForm = useForm<z.infer<typeof AdminUserFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(AdminUserFormSchema),
    defaultValues: {
      id: user.id || undefined,
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      is_active: user.is_active || false,
      is_admin: user.is_admin || false,
      verified_email: user.verified_email || false,
      verified_phone_number: user.verified_phone_number || false,
      password: user.password || '',
      authority: user.authority || undefined,
    },
  });
  const form = (props.admin ? adminForm : userForm) as UseFormReturn<
    z.infer<typeof UserFormSchema>
  >;

  const refreshUserData = async (id?: number) => {
    const res = await apiClient().users.adminGetUserById(
      id ?? (user.id as number),
    );
    setUser({ old: res.data, ...res.data });
  };
  const resetForm = () => {
    if (props.admin) {
      adminForm.reset({
        id: user.id || undefined,
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        is_active: user.is_active || false,
        is_admin: user.is_admin || false,
        verified_email: user.verified_email || false,
        verified_phone_number: user.verified_phone_number || false,
        authority: user.authority || undefined,
      });
    } else {
      userForm.reset({
        id: user.id || undefined,
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        is_active: user.is_active || false,
        is_admin: user.is_admin || false,
        verified_email: user.verified_email || false,
        verified_phone_number: user.verified_phone_number || false,
      });
    }
  };
  const handleSubmit = (data: User) => {
    setLoading((p) => ({ ...p, form: true }));
    //console.log('Submitting form with data: ', manualPassword, data, user);
    const new_data = {
      ...data,
      verified_email: user.verified_email,
      verified_phone_number: user.verified_phone_number,
      is_active: user.is_active,
      is_admin: user.is_admin,
      authority: user.is_admin
        ? data.authority ||
          adminForm.getValues('authority') ||
          AuthorityEnum.Inscription
        : null,
      password: manualPassword ? data.password : undefined,
    };
    //console.log('new_data:', new_data);

    setUser((s) => ({ ...s, ...new_data }));
    if (formType === 'add') {
      apiClient()
        .users.createUser({
          email: new_data.email as string,
          first_name: new_data.first_name as string,
          last_name: new_data.last_name as string,
          username: new_data.username as string,
          phone_number: new_data.phone_number,
          is_admin: props.admin || false,
          authority: props.admin
            ? (new_data.authority as UserCreationModelAuthorityEnum)
            : undefined,
          password: new_data.password,
        })
        .then((r) => {
          toast.success('Utilisateur créé avec succès', {
            id: 'user_creation_success',
          });
          setUser({ old: r.data, ...r.data });
          setFormtype('readonly');
        })
        .catch((e) => {
          console.log('error: ', e);

          if (e.response?.data?.detail?.code) {
            const code = e.response.data.detail.code;
            console.log(
              'error code: ',
              code,
              ERROR_CODES.EMAIL_ALREADY_EXISTS,
              ERROR_CODES.USERNAME_ALREADY_EXISTS === code,
            );

            if (code == ERROR_CODES.EMAIL_ALREADY_EXISTS) {
              toast.error(
                'Un utilisateur avec cette adresse e-mail existe déjà',
                {
                  id: 'email_already_exists',
                },
              );
              return;
            }
            if (code == ERROR_CODES.USERNAME_ALREADY_EXISTS) {
              toast.error(
                "Un utilisateur avec ce nom d'utilisateur existe déjà",
                {
                  id: 'username_already_exists',
                },
              );
              return;
            }
            if (code == ERROR_CODES.PHONE_NUMBER_ALREADY_EXISTS) {
              toast.error(
                'Un utilisateur avec ce numéro de téléphone existe déjà',
                {
                  id: 'phone_number_already_exists',
                },
              );
              return;
            }
          }
          toast.error("Échec de la création de l'utilisateur", {
            id: 'user_creation_failed',
          });
        })
        .finally(() => {
          setLoading((p) => ({ ...p, form: false }));
        });
      return;
    }

    apiClient()
      .users.adminUpdateUser(
        user.id as number,
        { ...new_data } as UserUpdateModel,
      )
      .then(() => {
        toast.success('Utilisateur mis à jour avec succès', {
          id: 'user_update_success',
        });
        refreshUserData();
      })
      .catch(() => {
        toast.error("Échec de la mise à jour de l'utilisateur", {
          id: 'user_update_failed',
        });
      })
      .finally(() => {
        setLoading((p) => ({ ...p, form: false }));
      });
  };

  // Reset state when dialog opens or user changes
  let [allowFormReset, setAllowFormReset] = useState(true);
  useEffect(() => {
    if (allowFormReset) {
      //console.log('user in modal: ', user);
      setFormtype(props.type || 'default');
      resetForm();
    } else {
      setAllowFormReset(true);
    }
  }, [user]);
  useEffect(() => {
    if (allowFormReset) {
      //console.log('props.user changed: ', props.user);
      setUser({ old: props.user, ...props.user });
      refreshUserData(props.user?.id as number);
    } else {
      setAllowFormReset(true);
    }
  }, [props.user]);

  const content = (
    <>
      {props.trigger && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        onInteractOutside={(e) => {
          //console.log('toasts', toasts);
          if (toasts.length > 0) {
            e.preventDefault();
          }
        }}
        className='max-h-[90vh] overflow-x-scroll min-w-fit max-w-full sm:w-[500px]'
      >
        <DialogTitle>{UserFormModalTypes[formType].title}</DialogTitle>
        <DialogDescription>
          {UserFormModalTypes[formType].description}
        </DialogDescription>

        {/* User Avatar & Status Section */}
        {formType !== 'add' && (
          <div className='rounded-lg p-6 space-y-4'>
            <UserAvatarWithUserName
              user={user as UserResponseModel}
              containerClassName='flex-col'
              avatarClassName='w-20 h-20 mb-2'
            />
            <div className='flex gap-3 justify-center flex-wrap'>
              <CheckBadge
                test={() => user.is_active || false}
                successText='Actif'
                failText='Inactif'
                disabled={formType === 'readonly'}
                className={user.is_active ? 'bg-primary' : undefined}
                variant={user.is_active ? 'default' : 'destructive'}
                onClick={() => {
                  setAllowFormReset(false);
                  setUser((s) => ({
                    ...s,
                    is_active: !s.is_active,
                  }));
                }}
              />
              <ActionBadge
                text={user.is_admin ? 'Administrateur' : 'Utilisateur'}
                disabled={formType === 'readonly'}
                className={user.is_admin ? 'bg-primary' : undefined}
                variant={user.is_admin ? 'default' : 'secondary'}
                onClick={() => {
                  setAllowFormReset(false);
                  setUser((s) => ({
                    ...s,
                    is_admin: !s.is_admin,
                    authority:
                      !s.is_admin && s.authority === null
                        ? AuthorityEnum.Inscription
                        : s.authority,
                  }));
                }}
              />
              {user.is_admin && (
                <UserAuthorityTypeBadge
                  user={user as UserResponseModel}
                  disabled={formType === 'readonly'}
                  onClick={() => {
                    setAllowFormReset(false);
                    setUser((s) => ({
                      ...s,
                      authority:
                        s.authority === AuthorityEnum.Inscription
                          ? AuthorityEnum.Vote
                          : AuthorityEnum.Inscription,
                    }));
                  }}
                />
              )}
            </div>
          </div>
        )}

        <form
          id='user-form'
          className='space-y-6 mt-6'
          onSubmit={form.handleSubmit(
            (data) => {
              handleSubmit(data as User);
            },
            (errors) => {
              console.log(errors);

              toast.error('Corriger les erreurs dans le formulaire', {
                id: 'form_validation_error',
              });
            },
          )}
        >
          {/* Personal Information Section */}
          <div className='space-y-4'>
            <SectionHeader
              icon={LucideUser}
              title='Informations personnelles'
            />
            <FieldGroup className='space-y-4'>
              <Controller
                name='last_name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='last_name'>Nom de famille</FieldLabel>
                    <Input
                      id='last_name'
                      placeholder='Entrez le nom de famille'
                      disabled={formType === 'readonly'}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='first_name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='first_name'>Prénom</FieldLabel>
                    <Input
                      id='first_name'
                      placeholder='Entrez le prénom'
                      disabled={formType === 'readonly'}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='username'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='username'>
                      Nom d'utilisateur
                    </FieldLabel>
                    <Input
                      id='username'
                      type='text'
                      placeholder="Entrez le nom d'utilisateur"
                      disabled={formType === 'readonly'}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          {/* Contact Information Section */}
          <div className='space-y-4'>
            <SectionHeader icon={LucideMail} title='Informations de contact' />
            <FieldGroup className='space-y-4'>
              <Controller
                name='email'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor='email'
                      className='flex flex-row justify-between items-center'
                    >
                      <span>Adresse e-mail</span>
                      {formType !== 'add' && (
                        <CheckBadge
                          test={() => user.verified_email || false}
                          successText='Vérifiée'
                          failText='Non vérifiée'
                          disabled={formType === 'readonly'}
                          onClick={() => {
                            setUser((s) => ({
                              ...s,
                              verified_email: !s.verified_email,
                            }));
                          }}
                        />
                      )}
                    </FieldLabel>
                    <Input
                      id='email'
                      type='email'
                      placeholder="Entrez l'adresse e-mail"
                      disabled={formType === 'readonly'}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='phone_number'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor='phone_number'
                      className='flex flex-row justify-between items-center'
                    >
                      <span>Numéro de téléphone</span>
                      {formType !== 'add' && (
                        <CheckBadge
                          test={() => user.verified_phone_number || false}
                          successText='Vérifié'
                          failText='Non vérifié'
                          disabled={formType === 'readonly'}
                          onClick={() => {
                            setUser((s) => ({
                              ...s,
                              verified_phone_number: !s.verified_phone_number,
                            }));
                          }}
                        />
                      )}
                    </FieldLabel>
                    <Input
                      id='phone_number'
                      type='tel'
                      placeholder='Entrez le numéro de téléphone'
                      disabled={formType === 'readonly'}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          {/* Actions Section */}
          <div className='space-y-4'>
            <SectionHeader
              icon={LucideLockKeyhole}
              title='Actions additionnelles'
            />
            <div className='space-y-2 bg-muted/30 rounded-lg p-4'>
              {formType === 'add' ? (
                <>
                  {props.admin && (
                    <Controller
                      name='authority'
                      control={adminForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='authority'>
                            Autorité de l'administrateur
                          </FieldLabel>

                          <Select
                            /* Bind the value and the change handler explicitly */
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder="Sélectionnez l'autorité" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(
                                UserCreationModelAuthorityEnum,
                              ).map((authority) => (
                                <SelectItem key={authority} value={authority}>
                                  {authority.toLocaleUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}
                  {manualPassword ? (
                    <Controller
                      name='password'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className='mt-2'
                        >
                          <FieldLabel htmlFor='password'>
                            <p>Mot de passe</p>
                          </FieldLabel>
                          <Input
                            id='password'
                            type='password'
                            placeholder='Entrez le mot de passe'
                            {...field}
                          />
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  ) : (
                    <p className='text-sm text-muted-foreground mt-2'>
                      Mot de passe: sera demander à la prochaine connexion
                    </p>
                  )}
                  <Button
                    variant='link'
                    className='p-0 m-0'
                    onClick={(e) => {
                      e.preventDefault();
                      setManualPassword(!manualPassword);
                    }}
                  >
                    {manualPassword
                      ? "Sinon laisser l'utilisateur de définir un mot de passe"
                      : "Sinon créer l'utilisateur avec un mot de passe défini"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant='ghost'
                    className={`w-full justify-start ${
                      formType === 'readonly' ? 'hidden' : ''
                    }`}
                    disabled={formType === 'readonly'}
                    type='button'
                  >
                    <LucidePenBox className='w-4 h-4' />
                    Changer le mot de passe
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    type='button'
                    disabled={loading.resetPassword}
                    onClick={() => {
                      setLoading((p) => ({ ...p, resetPassword: true }));
                      setDone((p) => ({
                        ...p,
                        resetPassword: {
                          state: false,
                          success: false,
                        },
                      }));

                      Promise.all([
                        apiClient().users.adminUpdateUser(
                          user.id as number,
                          { request_password_reset: true } as UserUpdateModel,
                        ),
                        apiClient().auth.passwordResetRequest({
                          email: user.email as string,
                        }),
                      ])
                        .then(() => {
                          toast.success(
                            'Demande de réinitialisation du mot de passe effectuée avec succès',
                            {
                              id: 'password_reset_request_success',
                            },
                          );
                          setDone((p) => ({
                            ...p,
                            resetPassword: {
                              state: true,
                              success: true,
                            },
                          }));
                        })
                        .catch(() => {
                          toast.error(
                            'Échec de la demande de réinitialisation du mot de passe',
                            {
                              id: 'password_reset_request_failed',
                            },
                          );
                          setDone((p) => ({
                            ...p,
                            resetPassword: {
                              state: true,
                              success: false,
                            },
                          }));
                        })
                        .finally(() => {
                          setLoading((p) => ({ ...p, resetPassword: false }));
                        });
                    }}
                  >
                    {(done.resetPassword.state &&
                      done.resetPassword.success === null) ||
                    loading.resetPassword ? (
                      <LucideRefreshCcw
                        className={
                          loading.resetPassword
                            ? 'w-4 h-4 animate-spin'
                            : 'w-4 h-4'
                        }
                      />
                    ) : done.resetPassword.success ? (
                      <LucideCheck className='w-4 h-4 text-green-500' />
                    ) : (
                      <LucideX className='w-4 h-4 text-destructive' />
                    )}
                    Demander une réinitialisation du mot de passe
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    type='button'
                    disabled={loading.sendVerificationEmail}
                    onClick={() => {
                      setLoading((p) => ({
                        ...p,
                        sendVerificationEmail: true,
                      }));
                      setDone((p) => ({
                        ...p,
                        sendVerificationEmail: {
                          state: false,
                          success: false,
                        },
                      }));
                      apiClient()
                        .admin.sendVerificationEmail(user.id as number)
                        .then(() => {
                          toast.success(
                            'E-mail de vérification renvoyé avec succès',
                            {
                              id: 'verification_email_sent',
                            },
                          );

                          setDone((p) => ({
                            ...p,
                            sendVerificationEmail: {
                              state: true,
                              success: true,
                            },
                          }));
                        })
                        .catch(() => {
                          toast.error(
                            "Échec de l'envoi de l'e-mail de vérification",
                            {
                              id: 'verification_email_failed',
                            },
                          );

                          setDone((p) => ({
                            ...p,
                            sendVerificationEmail: {
                              state: true,
                              success: false,
                            },
                          }));
                        })
                        .finally(() => {
                          setLoading((p) => ({
                            ...p,
                            sendVerificationEmail: false,
                          }));
                        });
                    }}
                  >
                    {(done.sendVerificationEmail.state &&
                      done.sendVerificationEmail.success === null) ||
                    loading.sendVerificationEmail ? (
                      loading.sendVerificationEmail ? (
                        <Spinner className='w-4 h-4' />
                      ) : (
                        <LucideMail className='w-4 h-4' />
                      )
                    ) : done.sendVerificationEmail.success ? (
                      <LucideCheck className='w-4 h-4 text-green-500' />
                    ) : (
                      <LucideX className='w-4 h-4 text-destructive' />
                    )}
                    Envoyer un e-mail de vérification
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className='mt-6'>
          <div className='flex gap-3 flex-wrap'>
            <Button
              form='user-form'
              type='submit'
              disabled={formType !== 'add' || loading.form}
              className={formType !== 'add' ? 'hidden' : ''}
            >
              <LucideUserPlus className='w-4 h-4' />
              Créer
            </Button>

            <Button
              form='user-form'
              type='submit'
              disabled={formType !== 'default' || loading.form}
              className={formType !== 'default' ? 'hidden' : ''}
            >
              <LucidePenBox className='w-4 h-4' />
              Enregistrer
            </Button>
            <Button
              disabled={formType !== 'readonly'}
              className={formType === 'readonly' ? '' : 'hidden'}
              onClick={() => setFormtype('default')}
            >
              <LucidePenBox className='w-4 h-4' />
              Modifier
            </Button>
            <Button
              variant='secondary'
              onClick={() => onOpenChange(false)}
              type='button'
            >
              <LucideX className='w-4 h-4' />
              Fermer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </>
  );

  return props.content_only ? (
    content
  ) : (
    <Dialog open={props.open ?? open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
};

export default UserFormModal;
