import apiClient, { ERROR_CODES } from '@/api/client';
import {
  UserCreationModelAuthorityEnum,
  type AdminUserResponseModel,
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
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { toast, useSonner } from 'sonner';
import type z from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

type DoneState = { state: boolean; success: boolean | null };

type AsyncActionKey = 'resetPassword' | 'sendVerificationEmail';

// An account as the lists show it, with what only the full view (AdminUserResponseModel) adds, and the password being typed.
// The server never sends a password, nor its hash: the field always starts empty.
type FormUser = UserResponseModel &
  Partial<
    Pick<
      AdminUserResponseModel,
      'verified_email' | 'verified_phone_number' | 'requested_password_reset' | 'created_at'
    >
  > & { password?: string };

interface UserFormModalProps {
  user?: FormUser;
  type: keyof typeof UserFormModalTypes | undefined;
  trigger?: React.ReactNode;
  content_only?: boolean;
  open?: boolean;
  onOpenChange?: (
    open: boolean,
    defaultSetOpen?: Dispatch<SetStateAction<boolean>>,
  ) => void;
  admin?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UserFormModal = (props: UserFormModalProps) => {
  const { toasts } = useSonner();

  const [user, setUser] = useState({ old: props.user, ...props.user });
  const [manualPassword, setManualPassword] = useState(false);
  const [loading, setLoading] = useState({
    form: false,
    resetPassword: false,
    sendVerificationEmail: false,
  });
  const [done, setDone] = useState<Record<AsyncActionKey, DoneState>>({
    resetPassword: { state: true, success: null },
    sendVerificationEmail: { state: true, success: null },
  });

  const [open, setOpen] = useState(false);
  const onOpenChange =
    props.onOpenChange !== undefined
      ? (open: boolean) => props.onOpenChange?.(open, setOpen)
      : setOpen;

  const [formType, setFormtype] = useState(props.type ?? 'default');

  // ── Forms ──────────────────────────────────────────────────────────────────

  const userForm = useForm<z.infer<typeof UserFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      id: user.id ?? undefined,
      username: user.username ?? '',
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      is_active: user.is_active ?? false,
      is_admin: user.is_admin ?? false,
      verified_email: user.verified_email ?? false,
      verified_phone_number: user.verified_phone_number ?? false,
      password: '',
    },
  });

  const adminForm = useForm<z.infer<typeof AdminUserFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(AdminUserFormSchema),
    defaultValues: {
      id: user.id ?? undefined,
      username: user.username ?? '',
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      is_active: user.is_active ?? false,
      is_admin: user.is_admin ?? false,
      verified_email: user.verified_email ?? false,
      verified_phone_number: user.verified_phone_number ?? false,
      password: '',
      authority: user.authority ?? undefined,
    },
  });

  const form = (props.admin ? adminForm : userForm) as UseFormReturn<
    z.infer<typeof UserFormSchema>
  >;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const refreshUserData = async (id?: number) => {
    const targetId = id ?? user.id;
    if (!targetId) return;
    const res = await apiClient().users.adminGetUserById(targetId);
    setUser({ old: res.data, ...res.data });
  };

  const resetForm = () => {
    const base = {
      id: user.id ?? undefined,
      username: user.username ?? '',
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      is_active: user.is_active ?? false,
      is_admin: user.is_admin ?? false,
      verified_email: user.verified_email ?? false,
      verified_phone_number: user.verified_phone_number ?? false,
    };
    if (props.admin) {
      adminForm.reset({ ...base, authority: user.authority ?? undefined });
    } else {
      userForm.reset(base);
    }
  };

  // ── Use a ref to skip the form-reset effect when we update user state
  //    ourselves (e.g. toggling is_active / is_admin badges).
  //    Using a ref instead of state avoids a double-render.
  const skipNextUserEffect = useRef(false);

  const setUserWithoutReset = (updater: (prev: typeof user) => typeof user) => {
    skipNextUserEffect.current = true;
    setUser(updater);
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Re-sync form when internal `user` state changes (e.g. after refreshUserData)
  useEffect(() => {
    if (skipNextUserEffect.current) {
      skipNextUserEffect.current = false;
      return;
    }
    setFormtype(props.type ?? 'default');
    resetForm();
  }, [user]);

  // Re-sync when the parent changes the `props.user` prop
  useEffect(() => {
    setUser({ old: props.user, ...props.user });
    if (props.user?.id) {
      refreshUserData(props.user.id);
    }
  }, [props.user]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (data: FormUser) => {
    setLoading((p) => ({ ...p, form: true }));

    const new_data = {
      ...data,
      verified_email: user.verified_email,
      verified_phone_number: user.verified_phone_number,
      is_active: user.is_active,
      is_admin: user.is_admin,
      authority: user.is_admin
        ? (data.authority ??
          adminForm.getValues('authority') ??
          UserCreationModelAuthorityEnum.Inscription)
        : null,
      password: manualPassword ? data.password : undefined,
    };

    setUser((s) => ({ ...s, ...new_data }));

    if (formType === 'add') {
      apiClient()
        .users.createUser({
          email: new_data.email as string,
          first_name: new_data.first_name as string,
          last_name: new_data.last_name as string,
          username: new_data.username as string,
          phone_number: new_data.phone_number,
          is_admin: props.admin ?? false,
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
          const code = e.response?.data?.detail?.code;
          if (code === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
            toast.error(
              'Un utilisateur avec cette adresse e-mail existe déjà',
              { id: 'email_already_exists' },
            );
          } else if (code === ERROR_CODES.USERNAME_ALREADY_EXISTS) {
            toast.error(
              "Un utilisateur avec ce nom d'utilisateur existe déjà",
              { id: 'username_already_exists' },
            );
          } else if (code === ERROR_CODES.PHONE_NUMBER_ALREADY_EXISTS) {
            toast.error(
              'Un utilisateur avec ce numéro de téléphone existe déjà',
              { id: 'phone_number_already_exists' },
            );
          } else {
            toast.error("Échec de la création de l'utilisateur", {
              id: 'user_creation_failed',
            });
          }
        })
        .finally(() => setLoading((p) => ({ ...p, form: false })));
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
      .finally(() => setLoading((p) => ({ ...p, form: false })));
  };

  // ── Async action handlers (extracted from JSX) ─────────────────────────────

  const handleResetPassword = () => {
    setLoading((p) => ({ ...p, resetPassword: true }));
    setDone((p) => ({ ...p, resetPassword: { state: false, success: false } }));

    Promise.all([
      apiClient().users.adminUpdateUser(
        user.id as number,
        { request_password_reset: true } as UserUpdateModel,
      ),
      apiClient().auth.passwordResetRequest({ email: user.email as string }),
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
          resetPassword: { state: true, success: true },
        }));
      })
      .catch(() => {
        toast.error('Échec de la demande de réinitialisation du mot de passe', {
          id: 'password_reset_request_failed',
        });
        setDone((p) => ({
          ...p,
          resetPassword: { state: true, success: false },
        }));
      })
      .finally(() => setLoading((p) => ({ ...p, resetPassword: false })));
  };

  const handleSendVerificationEmail = () => {
    setLoading((p) => ({ ...p, sendVerificationEmail: true }));
    setDone((p) => ({
      ...p,
      sendVerificationEmail: { state: false, success: false },
    }));

    apiClient()
      .admin.sendVerificationEmail(user.id as number)
      .then(() => {
        toast.success('E-mail de vérification renvoyé avec succès', {
          id: 'verification_email_sent',
        });
        setDone((p) => ({
          ...p,
          sendVerificationEmail: { state: true, success: true },
        }));
      })
      .catch(() => {
        toast.error("Échec de l'envoi de l'e-mail de vérification", {
          id: 'verification_email_failed',
        });
        setDone((p) => ({
          ...p,
          sendVerificationEmail: { state: true, success: false },
        }));
      })
      .finally(() =>
        setLoading((p) => ({ ...p, sendVerificationEmail: false })),
      );
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const actionIcon = (key: AsyncActionKey, idleIcon: React.ReactNode) => {
    if (loading[key]) {
      return key === 'sendVerificationEmail' ? (
        <Spinner className='w-4 h-4' />
      ) : (
        <LucideRefreshCcw className='w-4 h-4 animate-spin' />
      );
    }
    if (done[key].success === null || done[key].state) return idleIcon;
    return done[key].success ? (
      <LucideCheck className='w-4 h-4 text-green-500' />
    ) : (
      <LucideX className='w-4 h-4 text-destructive' />
    );
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  const content = (
    <>
      {props.trigger && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        onInteractOutside={(e) => {
          if (toasts.length > 0) e.preventDefault();
        }}
        className='flex flex-col w-full max-w-lg max-h-[90dvh] overflow-y-auto mx-2 sm:mx-auto'
      >
        <DialogTitle>{UserFormModalTypes[formType].title}</DialogTitle>
        <DialogDescription>
          {UserFormModalTypes[formType].description}
        </DialogDescription>

        {/* Avatar & status badges */}
        {formType !== 'add' && (
          <div className='rounded-lg p-3 sm:p-6 space-y-4'>
            <UserAvatarWithUserName
              user={user as UserResponseModel}
              containerClassName='flex-col'
              avatarClassName='w-20 h-20 mb-2'
            />
            <div className='flex gap-3 justify-center flex-wrap'>
              <CheckBadge
                test={() => user.is_active ?? false}
                successText='Actif'
                failText='Inactif'
                disabled={formType === 'readonly'}
                className={user.is_active ? 'bg-primary' : undefined}
                variant={user.is_active ? 'default' : 'destructive'}
                onClick={() =>
                  setUserWithoutReset((s) => ({
                    ...s,
                    is_active: !s.is_active,
                  }))
                }
              />
              <ActionBadge
                text={user.is_admin ? 'Administrateur' : 'Utilisateur'}
                disabled={formType === 'readonly'}
                className={user.is_admin ? 'bg-primary' : undefined}
                variant={user.is_admin ? 'default' : 'secondary'}
                onClick={() =>
                  setUserWithoutReset((s) => ({
                    ...s,
                    is_admin: !s.is_admin,
                    authority:
                      !s.is_admin && s.authority === null
                        ? UserCreationModelAuthorityEnum.Inscription
                        : s.authority,
                  }))
                }
              />
              {user.is_admin && (
                <UserAuthorityTypeBadge
                  user={user as UserResponseModel}
                  disabled={formType === 'readonly'}
                  onClick={() =>
                    setUserWithoutReset((s) => ({
                      ...s,
                      authority:
                        s.authority === UserCreationModelAuthorityEnum.Inscription
                          ? UserCreationModelAuthorityEnum.Vote
                          : UserCreationModelAuthorityEnum.Inscription,
                    }))
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form
          id='user-form'
          className='space-y-6 mt-6'
          onSubmit={form.handleSubmit(
            (data) => handleSubmit(data as FormUser),
            (errors) => {
              console.log(errors);
              toast.error('Corriger les erreurs dans le formulaire', {
                id: 'form_validation_error',
              });
            },
          )}
        >
          {/* Personal information */}
          <div className='space-y-4'>
            <SectionHeader
              icon={LucideUser}
              title='Informations personnelles'
            />
            <FieldGroup className='space-y-4'>
              {(['last_name', 'first_name', 'username'] as const).map(
                (name) => (
                  <Controller
                    key={name}
                    name={name}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={name}>
                          {name === 'last_name'
                            ? 'Nom de famille'
                            : name === 'first_name'
                              ? 'Prénom'
                              : "Nom d'utilisateur"}
                        </FieldLabel>
                        <Input
                          id={name}
                          placeholder={
                            name === 'last_name'
                              ? 'Entrez le nom de famille'
                              : name === 'first_name'
                                ? 'Entrez le prénom'
                                : "Entrez le nom d'utilisateur"
                          }
                          disabled={formType === 'readonly'}
                          {...field}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                ),
              )}
            </FieldGroup>
          </div>

          {/* Contact information */}
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
                          test={() => user.verified_email ?? false}
                          successText='Vérifiée'
                          failText='Non vérifiée'
                          disabled={formType === 'readonly'}
                          onClick={() =>
                            setUser((s) => ({
                              ...s,
                              verified_email: !s.verified_email,
                            }))
                          }
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
                          test={() => user.verified_phone_number ?? false}
                          successText='Vérifié'
                          failText='Non vérifié'
                          disabled={formType === 'readonly'}
                          onClick={() =>
                            setUser((s) => ({
                              ...s,
                              verified_phone_number: !s.verified_phone_number,
                            }))
                          }
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

          {/* Additional actions */}
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
                              ).map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a.toLocaleUpperCase()}
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
                            Mot de passe
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
                      Mot de passe : sera demandé à la prochaine connexion
                    </p>
                  )}

                  <Button
                    variant='link'
                    className='p-0 m-0 h-auto whitespace-normal text-left'
                    onClick={(e) => {
                      e.preventDefault();
                      setManualPassword((p) => !p);
                    }}
                  >
                    {manualPassword
                      ? "Laisser l'utilisateur définir son mot de passe"
                      : "Créer l'utilisateur avec un mot de passe défini"}
                  </Button>
                </>
              ) : (
                <>
                  {formType !== 'readonly' && (
                    <Button
                      variant='ghost'
                      className='w-full justify-start h-auto whitespace-normal text-left py-2'
                      disabled
                      type='button'
                    >
                      <LucidePenBox className='w-4 h-4 mr-2 shrink-0' />
                      Changer le mot de passe
                    </Button>
                  )}

                  <Button
                    variant='ghost'
                    className='w-full justify-start h-auto whitespace-normal text-left py-2'
                    type='button'
                    disabled={loading.resetPassword}
                    onClick={handleResetPassword}
                  >
                    {actionIcon(
                      'resetPassword',
                      <LucideRefreshCcw className='w-4 h-4 mr-2 shrink-0' />,
                    )}
                    Demander une réinitialisation du mot de passe
                  </Button>

                  <Button
                    variant='ghost'
                    className='w-full justify-start h-auto whitespace-normal text-left py-2'
                    type='button'
                    disabled={loading.sendVerificationEmail}
                    onClick={handleSendVerificationEmail}
                  >
                    {actionIcon(
                      'sendVerificationEmail',
                      <LucideMail className='w-4 h-4 mr-2 shrink-0' />,
                    )}
                    Envoyer un e-mail de vérification
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className='mt-6'>
          <div className='flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end'>
            {formType === 'add' && (
              <Button
                className='w-full sm:w-auto'
                form='user-form'
                type='submit'
                disabled={loading.form}
              >
                <LucideUserPlus className='w-4 h-4 mr-2' />
                Créer
              </Button>
            )}
            {formType === 'default' && (
              <Button
                className='w-full sm:w-auto'
                form='user-form'
                type='submit'
                disabled={loading.form}
              >
                <LucidePenBox className='w-4 h-4 mr-2' />
                Enregistrer
              </Button>
            )}
            {formType === 'readonly' && (
              <Button
                className='w-full sm:w-auto'
                onClick={() => setFormtype('default')}
              >
                <LucidePenBox className='w-4 h-4 mr-2' />
                Modifier
              </Button>
            )}
            <Button
              className='w-full sm:w-auto'
              variant='secondary'
              onClick={() => onOpenChange(false)}
              type='button'
            >
              <LucideX className='w-4 h-4 mr-2' />
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
