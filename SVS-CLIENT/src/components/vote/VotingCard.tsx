import apiClient from '@/api/client';
import type {
  Candidate,
  FullVoteResponseModel,
  UserResponseModel,
  VoteCreationModel,
} from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import UserInfoRow from '@/components/users/UserInfoRow';
import UserAvatarWithUserName from '@/components/utils/UserAvatarWithUserName';
import { UserSearch } from '@/components/utils/UserSearch';
import CandidateCard from '@/components/vote/CandidateCard';
import CandidateFormModal from '@/components/vote/CandidateFormModal';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { UsersTableData } from '@/pages/RegularUsersAdministrationPage';
import { VoteFormSchema } from '@/schemas/vote.schemas';
import { VoteBadgeType } from '@/utils/vote.utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LucideCalendarPlus,
  LucidePenBox,
  LucidePlusCircle,
  LucideX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const VotingCard = (props: {
  fullVote?: FullVoteResponseModel;
  flat?: boolean;
  editable?: boolean;
}) => {
  const { user } = useAuth();
  const isNewVote = props.fullVote ? false : true;
  const [loading, setLoading] = useState({
    participantsSearch: false,
    excludedUsersSearch: false,
  });
  const newVote: FullVoteResponseModel = {
    total_bulletins: 0,
    candidates: [],
    vote: {
      user_has_voted: false,
      abstention_count: 0,
      voter_count: 0,
      candidate_results: {},
      total_bulletins: 0,
      candidates: [],
      winner_candidates: [],
      vote: {
        id: 0,
        has_been_counted: false,
        title: 'Nouveau Vote',
        description: 'Description du vote',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        creator: {
          id: user?.id as number,
          username: user?.username as string,
          email: user?.email as string,
          first_name: user?.first_name as string,
          last_name: user?.last_name as string,
          is_active: user?.is_active as boolean,
          is_admin: user?.is_admin as boolean,
          phone_number: user?.phone_number as string,
        },
      },
    },
  };
  const [vote, setVote] = useState<FullVoteResponseModel>(
    props.fullVote ?? newVote,
  );
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  const start_date = new Date(vote.vote.vote.start_date).toLocaleDateString();
  const end_date = new Date(vote.vote.vote.end_date).toLocaleDateString();
  const [reste, setReste] = useState({
    message: '',
    isEndingSoon: false,
  });
  const [isVotingDisabled, setIsVotingDisabled] = useState({
    value: false,
    state: VoteBadgeType.Ongoing,
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [openToAll, setOpenToAll] = useState(true);
  const [winnerCount, setWinnerCount] = useState<number>(0);
  const fetchVote = () => {
    apiClient()
      .vote.getVoteById(vote.vote.vote.id)
      .then((res) => {
        console.log('Vote refreshed');
        setVote(res.data);
      })
      .catch((err) => {
        console.error('Failed to refresh vote details:', err);
        toast.error('Échec de la récupération des détails du vote');
      });
  };
  useEffect(() => {
    if (vote.vote.user_has_voted) {
      console.log('Disabling voting because user has already voted');
      if (!isVotingDisabled.value) {
        setIsVotingDisabled((p) => ({
          ...p,
          value: true,
        }));
      }
    }
  }, [isVotingDisabled, vote.vote.user_has_voted]);
  useEffect(() => {
    if (isVotingDisabled.value) return;
    const updateReste = () => {
      const now = new Date();
      const reste_jours = Math.ceil(
        (new Date(vote.vote.vote.end_date).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const reste_heures = Math.ceil(
        (new Date(vote.vote.vote.end_date).getTime() - now.getTime()) /
          (1000 * 60 * 60),
      );
      const reste_minutes = Math.ceil(
        (new Date(vote.vote.vote.end_date).getTime() - now.getTime()) /
          (1000 * 60),
      );

      if (reste_minutes < 0) {
        setIsVotingDisabled({
          value: true,
          state: VoteBadgeType.Finished,
        });
      }
      if (new Date(vote.vote.vote.end_date) < now) {
        setIsVotingDisabled({
          value: true,
          state: VoteBadgeType.Finished,
        });
        setReste({ message: 'Le vote est terminé', isEndingSoon: false });
        return;
      }
      if (new Date(vote.vote.vote.start_date) > now) {
        setIsVotingDisabled({
          value: true,
          state: VoteBadgeType.Upcoming,
        });
        setReste({
          message: "Le vote n'a pas encore commencé",
          isEndingSoon: false,
        });
        return;
      }

      const reste_string =
        reste_jours > 1
          ? `${reste_jours} jour(s) restantes`
          : reste_heures > 1
            ? `${reste_heures} heure(s) restantes`
            : `${reste_minutes} minute(s) restantes`;
      setReste({
        message: reste_string,
        isEndingSoon: reste_jours <= 3,
      });
    };

    const interval = setInterval(updateReste, 60000); // Met à jour toutes les minutes
    updateReste(); // Appel initial
    return () => clearInterval(interval);
  }, [vote, isVotingDisabled]);
  useEffect(() => {
    // Determine winner if vote is finished
    if (isVotingDisabled.state === VoteBadgeType.Finished) {
      let maxVotes = 0;
      vote.candidates.forEach((candidate) => {
        if ((candidate.vote_count ?? 0) > maxVotes) {
          maxVotes = candidate.vote_count ?? 0;
        }
      });
      if (maxVotes !== winnerCount) {
        setWinnerCount(maxVotes);
      }
    }
  }, [isVotingDisabled, vote.candidates, winnerCount]);

  const EditableComponent = (props: {
    editable?: boolean;
    dropdown?: boolean;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    if (props.editable) {
      const editButton = (
        <Button variant={'ghost'} onClick={props.onClick}>
          <LucidePenBox />
        </Button>
      );
      return (
        <div
          className={cn(
            'flex flex-row flex-nowrap gap-2 justify-center items-center',
            props.className,
          )}
        >
          {props.children}
          {props.editable ? (
            props.dropdown ? (
              <DropdownMenuTrigger asChild>{editButton}</DropdownMenuTrigger>
            ) : (
              editButton
            )
          ) : null}
        </div>
      );
    }
    return <>{props.children}</>;
  };
  const form = useForm<z.input<typeof VoteFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(VoteFormSchema),
    defaultValues: {
      title: vote.vote.vote.title,
      description: vote.vote.vote.description,
      start_date: new Date(vote.vote.vote.start_date),
      end_date: new Date(vote.vote.vote.end_date),
      candidates: [],
      open_to_all: openToAll,
      attributed_user_ids: [],
      excluded_user_ids: [],
    },
  });

  const [show, setShow] = useState({
    titleEdit: false,
    descriptionEdit: false,
  });

  const [participants, setParticipants] = useState<UsersTableData[]>([]);
  const [excludedUsers, setExcludedUsers] = useState<UsersTableData[]>([]);
  const [foundUsers, setFoundUsers] = useState<UsersTableData[]>([]);

  return (
    <Card
      className={`w-full p-4 overflow-hidden${props.flat ? ' rounded-none shadow-none border-0' : ''}`}
    >
      <form
        onSubmit={form.handleSubmit(
          (data) => {
            console.log('Submitting vote data:', data);
            const voteData: VoteCreationModel = {
              title: data.title,
              description: data.description,
              start_date: data.start_date.toISOString(),
              end_date: data.end_date.toISOString(),
              candidates: data.candidates as any,
              open_to_all: data.open_to_all,
              attributed_user_ids: participants.map((p) => p.id),
              excluded_user_ids: excludedUsers.map((u) => u.id),
            };
            apiClient()
              .vote.createVote(voteData)
              .then((res) => {
                toast.success('Vote Créé avec succès');
                console.log('Vote created:', res.data);
              })
              .catch((err) => {
                console.error('Failed to create vote:', err);
                toast.error('Échec de la création du vote');
              });
            // Handle vote update submission here
          },
          (errors) => {
            console.log('Vote form errors:', errors);
            toast.error('Corriger les erreurs dans le formulaire du vote');
          },
        )}
      >
        <FieldGroup>
          <CardTitle className='flex flex-col gap-4 justify-center items-center'>
            <div className='w-full flex flex-row flex-wrap gap-4 justify-between items-center'>
              {!show.titleEdit ? (
                <EditableComponent
                  editable={props.editable}
                  onClick={() => setShow((p) => ({ ...p, titleEdit: true }))}
                >
                  <h1 className='text-4xl'>{vote.vote.vote.title}</h1>
                </EditableComponent>
              ) : (
                <Controller
                  control={form.control}
                  name='title'
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className='max-w-xs'
                    >
                      <FieldLabel htmlFor='title'>Titre</FieldLabel>
                      <Input
                        id='title'
                        placeholder='Entrez le titre du vote'
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
              <div className='ml-auto'>
                <VoteBadge type={isVotingDisabled.state} />
              </div>
            </div>
            <div className='w-full flex flex-row flex-wrap gap-4 justify-between items-center'>
              <UserAvatarWithUserName user={vote.vote.vote.creator} />
              {!isNewVote && (
                <p
                  className={cn(
                    'text-sm text-muted-foreground ',
                    reste.isEndingSoon ? 'font-bold text-red-500' : '',
                  )}
                >
                  {reste.message}
                </p>
              )}
            </div>

            <div className='w-full flex flex-row flex-wrap gap-4 justify-between items-center'>
              <DropdownMenu>
                <EditableComponent dropdown editable={props.editable}>
                  <p className='text-sm text-muted-foreground'>
                    Début: {start_date}
                  </p>
                </EditableComponent>
                <DropdownMenuContent>
                  <Controller
                    control={form.control}
                    name='start_date'
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='start_date'>
                          Date de début
                        </FieldLabel>
                        <Calendar
                          mode='single'
                          selected={new Date(vote.vote.vote.start_date)}
                          onSelect={(date) => {
                            field.onChange(date);
                            setVote((p) => ({
                              ...p,
                              vote: {
                                ...p.vote,
                                vote: {
                                  ...p.vote.vote,
                                  start_date: date
                                    ? date.toISOString()
                                    : p.vote.vote.start_date,
                                },
                              },
                            }));
                          }}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <EditableComponent dropdown editable={props.editable}>
                  <p className='text-sm text-muted-foreground'>
                    Fin: {end_date}
                  </p>
                </EditableComponent>
                <DropdownMenuContent>
                  <Controller
                    control={form.control}
                    name='end_date'
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='end_date'>Date de fin</FieldLabel>
                        <Calendar
                          mode='single'
                          {...field}
                          selected={new Date(vote.vote.vote.end_date)}
                          onSelect={(date) => {
                            field.onChange(date);
                            setVote((p) => ({
                              ...p,
                              vote: {
                                ...p.vote,
                                vote: {
                                  ...p.vote.vote,
                                  end_date: date
                                    ? date.toISOString()
                                    : p.vote.vote.end_date,
                                },
                              },
                            }));
                          }}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
          <CardContent>
            <div className='w-full mb-6'>
              {!show.descriptionEdit ? (
                <EditableComponent
                  editable={props.editable}
                  className='justify-start'
                  onClick={() =>
                    setShow((p) => ({ ...p, descriptionEdit: true }))
                  }
                >
                  <p className='text-md text-muted-foreground'>
                    {vote.vote.vote.description}
                  </p>
                </EditableComponent>
              ) : (
                <Controller
                  control={form.control}
                  name='description'
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className='w-full'>
                      <FieldLabel htmlFor='description'>Description</FieldLabel>
                      <Textarea
                        id='description'
                        placeholder='Entrez la description du vote'
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </div>

            <div className='flex flex-col flex-nowrap justify-start items-center'>
              <h2 className='text-2xl font-semibold mt-6 mb-4 w-full'>
                Candidats
              </h2>

              {!isNewVote &&
                (isVotingDisabled.state === VoteBadgeType.Finished ? (
                  vote.vote.vote.has_been_counted ? (
                    <>
                      <p className='text-muted-foreground mb-4 w-full'>
                        Résultats du vote :
                      </p>
                      <p className='text-muted-foreground mb-4 w-full'>
                        {winnerCount === 0
                          ? "Aucun vote n'a été enregistré."
                          : `Le(s) gagnant(s) ont reçu ${winnerCount} vote(s).`}
                      </p>
                      <p className='text-muted-foreground mb-4 w-full'>
                        {vote.total_bulletins} bulletin(s) ont été
                        comptabilisé(s).
                      </p>

                      <p className='text-muted-foreground mb-4 w-full'>
                        {vote.vote.abstention_count > 0
                          ? `Il y a eu ${vote.vote.abstention_count} abstention(s).`
                          : 'Aucune abstention.'}
                      </p>
                    </>
                  ) : (
                    <p className='text-muted-foreground mb-4 w-full'>
                      Les votes n'ont pas encore été comptabilisés.
                    </p>
                  )
                ) : vote.vote.user_has_voted ? (
                  <p className='text-muted-foreground mb-4 w-full'>
                    Vous avez déjà voté.
                  </p>
                ) : (
                  <p className='text-muted-foreground mb-4 w-full'>
                    {vote.candidates.length >= 1
                      ? 'Sélectionnez un candidat pour voter :'
                      : 'Aucun candidat disponible pour ce vote.'}
                  </p>
                ))}
              {form.getFieldState('candidates').error && (
                <FieldError
                  errors={[form.getFieldState('candidates').error!]}
                />
              )}
              <div className='flex flex-row flex-wrap gap-8 justify-center items-center'>
                {vote.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedCandidate === candidate}
                    disabled={isVotingDisabled.value}
                    editable={props.editable}
                    onUpdated={() => fetchVote()}
                    isVoteFinished={
                      isVotingDisabled.state === VoteBadgeType.Finished
                    }
                    isWinner={
                      candidate.vote_count === winnerCount &&
                      isVotingDisabled.state === VoteBadgeType.Finished &&
                      winnerCount > 0
                    }
                    onClick={() => {
                      if (isVotingDisabled.value) return;
                      setSelectedCandidate(candidate);
                    }}
                    onDelete={
                      isNewVote
                        ? () => {
                            setVote((p) => ({
                              ...p,
                              candidates: p.candidates.filter(
                                (c) => c !== candidate,
                              ),
                            }));
                          }
                        : undefined
                    }
                  />
                ))}
                {props.editable ? (
                  <CandidateFormModal
                    formType='add'
                    initialData={{ vote_id: vote.vote.vote.id }}
                    open={showAddCandidateModal}
                    onOpenChange={setShowAddCandidateModal}
                    onSubmit={(data) => {
                      form.setValue('candidates', [
                        ...form.getValues('candidates'),
                        data,
                      ]);
                      setVote((p) => ({
                        ...p,
                        candidates: [...p.candidates, data as Candidate],
                      }));
                      /* apiClient()
                        .candidates.createCandidate({
                          ...data,
                          vote_id: vote.vote.vote.id,
                        })
                        .then(() => {
                          toast.success('Candidat ajouté avec succès');
                          fetchVote();
                        })
                        .catch((err) => {
                          console.error('Failed to add candidate:', err);
                          toast.error("Échec de l'ajout du candidat");
                        })
                        .finally(() => {
                          setShowAddCandidateModal(false);
                        }); */
                    }}
                    trigger={
                      <Card
                        onClick={() => {
                          setShowAddCandidateModal(true);
                        }}
                      >
                        <CardContent className='flex justify-center items-center'>
                          <div className='flex flex-col flex-nowrap justify-center items-center hover:scale-105 transition-transform cursor-pointer p-4'>
                            <LucidePlusCircle size={48} className='mb-2' />
                            <p>Ajouter un candidat</p>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                ) : null}
              </div>
            </div>
            {isNewVote && (
              <div className='flex flex-col flex-nowrap justify-start items-center'>
                <h2 className='text-2xl font-semibold mt-6 mb-4 w-full'>
                  Votants
                </h2>
                <div className='w-full flex flex-row flex-nowrap gap-4 justify-start items-center'>
                  <Switch
                    checked={form.getValues('open_to_all')}
                    onCheckedChange={(checked) => {
                      form.setValue('open_to_all', checked);
                      setOpenToAll(checked);
                    }}
                  />
                  <p>
                    Vote Ouvert à{' '}
                    {form.getValues('open_to_all')
                      ? 'tous les utilisateurs'
                      : "une liste restreinte d'utilisateurs"}
                  </p>
                </div>
                <div className='text-sm text-muted-foreground mt-2'>
                  {form.getValues('open_to_all')
                    ? 'Tous les utilisateurs enregistrés peuvent participer à ce vote.'
                    : 'Seuls les utilisateurs spécifiquement attribués pourront participer à ce vote.'}
                </div>
                {openToAll ? null : (
                  <div className='w-full mt-4 flex flex-row flex-wrap gap-8 justify-center items-start'>
                    <Card className='max-w-[400px] p-2'>
                      <CardTitle>Participants</CardTitle>
                      <CardContent className='flex flex-col justify-center items-center flex-nowrap gap-2'>
                        <p className='text-sm text-muted-foreground'>
                          {participants.length} votant(s) attribué(s) pour ce
                          vote.
                        </p>
                        <UserSearch
                          users={
                            foundUsers.filter(
                              (u) =>
                                participants.findIndex((p) => p.id === u.id) ===
                                -1,
                            ) as UserResponseModel[]
                          }
                          loading={loading.participantsSearch}
                          onSelectUser={(u) => {
                            if (
                              participants.findIndex((v) => v.id === u.id) ===
                              -1
                            ) {
                              setParticipants((p) => [...p, u]);
                              setExcludedUsers((p) =>
                                p.filter((v) => v.id !== u.id),
                              );
                              setFoundUsers((p) =>
                                p.filter((v) => v.id !== u.id),
                              );
                            }
                          }}
                          onSearchChange={(v) => {
                            setLoading((p) => ({
                              ...p,
                              participantsSearch: true,
                            }));
                            apiClient()
                              .users.getUsers(undefined, undefined, v)
                              .then((response) => {
                                setFoundUsers(
                                  response.data.data as UserResponseModel[],
                                );
                              })
                              .finally(() => {
                                setLoading((p) => ({
                                  ...p,
                                  participantsSearch: false,
                                }));
                              });
                          }}
                        />
                        <Table>
                          <TableBody>
                            {participants.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <UserInfoRow
                                    user={user as UserResponseModel}
                                  />
                                </TableCell>
                                <TableCell className='w-0'>
                                  <Button
                                    variant='ghost'
                                    className='hover:bg-destructive/10 hover:text-destructive rounded-full p-1'
                                    onClick={() => {
                                      setParticipants((p) =>
                                        p.filter((u) => u.id !== user.id),
                                      );
                                    }}
                                  >
                                    <LucideX />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className='max-w-[400px] p-2'>
                      <CardTitle>Exclus</CardTitle>
                      <CardContent className='flex flex-col justify-center items-center flex-nowrap gap-2'>
                        <p className='text-sm text-muted-foreground'>
                          {excludedUsers.length} votant(s) exclus pour ce vote.
                        </p>
                        <UserSearch
                          users={
                            foundUsers.filter(
                              (u) =>
                                excludedUsers.findIndex(
                                  (p) => p.id === u.id,
                                ) === -1,
                            ) as UserResponseModel[]
                          }
                          loading={loading.excludedUsersSearch}
                          onSelectUser={(u) => {
                            if (
                              excludedUsers.findIndex((v) => v.id === u.id) ===
                              -1
                            ) {
                              setExcludedUsers((p) => [...p, u]);
                              setParticipants((p) =>
                                p.filter((v) => v.id !== u.id),
                              );
                              setFoundUsers((p) =>
                                p.filter((v) => v.id !== u.id),
                              );
                            }
                          }}
                          onSearchChange={(v) => {
                            setLoading((p) => ({
                              ...p,
                              excludedUsersSearch: true,
                            }));
                            apiClient()
                              .users.getUsers(undefined, undefined, v)
                              .then((response) => {
                                setFoundUsers(
                                  response.data.data as UserResponseModel[],
                                );
                              })
                              .finally(() => {
                                setLoading((p) => ({
                                  ...p,
                                  excludedUsersSearch: false,
                                }));
                              });
                          }}
                        />
                        <Table>
                          <TableBody>
                            {excludedUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <UserInfoRow
                                    user={user as UserResponseModel}
                                  />
                                </TableCell>
                                <TableCell className='w-0'>
                                  <Button
                                    variant='ghost'
                                    className='hover:bg-destructive/10 hover:text-destructive rounded-full p-1'
                                    onClick={() => {
                                      setExcludedUsers((p) =>
                                        p.filter((u) => u.id !== user.id),
                                      );
                                    }}
                                  >
                                    <LucideX />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <CardAction className='w-full flex flex-row flex-nowrap justify-end items-center'>
              {isNewVote && (
                <Button variant='default' type='submit'>
                  <LucideCalendarPlus /> Créer le vote
                </Button>
              )}

              {props.editable ? null : (
                <Button
                  disabled={
                    isVotingDisabled.value || selectedCandidate === null
                  }
                  onClick={() => {
                    if (selectedCandidate === null) return;
                    setIsVotingDisabled((p) => ({ ...p, value: true }));
                    apiClient()
                      .vote.vote(vote.vote.vote.id, {
                        content: `${selectedCandidate?.id}`,
                      })
                      .then(() => {
                        window.location.reload();
                      })
                      .catch((err) => {
                        console.error('Error while voting:', err);
                        toast.error(
                          "Une erreur est survenue lors de l'enregistrement de votre vote. Veuillez réessayer.",
                        );
                        setIsVotingDisabled((p) => ({ ...p, value: false }));
                      });
                  }}
                >
                  {vote.vote.user_has_voted ? 'Déjà voté' : 'Voter'}
                </Button>
              )}
            </CardAction>
          </CardFooter>
        </FieldGroup>
      </form>
    </Card>
  );
};

export default VotingCard;
