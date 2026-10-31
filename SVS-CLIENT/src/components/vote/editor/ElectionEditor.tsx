import apiClient from '@/api/client';
import type { FullVoteResponseModel, VoteCreationModel, VoteUpdateModel } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import CandidatesEditor from '@/components/vote/editor/CandidatesEditor';
import FormField from '@/components/vote/editor/FormField';
import Panel from '@/components/vote/editor/Panel';
import { CurrentRoll, RollChooser } from '@/components/vote/editor/RollEditor';
import { EMPTY_ROLL, rollProblem, rollToRequest, type RollChoice } from '@/components/vote/editor/roll';
import { ElectionFormSchema, type ElectionFormValues } from '@/schemas/vote.schemas';
import { routes, routesBuilders } from '@/services/routing';
import { formatDuration, fromInputValue, parseInputValue, toInputValue } from '@/utils/dates';
import { getBadgeType } from '@/utils/vote.utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideCalendarPlus, LucideSave, LucideTrash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const valuesOf = (fullVote?: FullVoteResponseModel): ElectionFormValues => {
  if (!fullVote) {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(8, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    end.setHours(18, 0, 0, 0);
    return {
      title: '',
      description: '',
      start: toInputValue(start),
      end: toInputValue(end),
      candidates: [
        { first_name: '', last_name: '', photo_url: '' },
        { first_name: '', last_name: '', photo_url: '' },
      ],
    };
  }
  const election = fullVote.vote.vote;
  return {
    title: election.title,
    description: election.description,
    start: toInputValue(election.start_date),
    end: toInputValue(election.end_date),
    candidates: fullVote.candidates.map((c) => ({
      first_name: c.first_name,
      last_name: c.last_name,
      photo_url: c.photo_url ?? '',
    })),
  };
};

const request = (values: ElectionFormValues) => ({
  title: values.title.trim(),
  description: values.description.trim(),
  start_date: fromInputValue(values.start),
  end_date: fromInputValue(values.end),
  candidates: values.candidates.map((c) => ({
    first_name: c.first_name.trim(),
    last_name: c.last_name.trim(),
    photo_url: c.photo_url.trim() || null,
  })),
});

/**
 * Where the administrators of the elections make one, or change one that has not opened. Everything is held here until Save: the
 * candidates are replaced as a whole (the election has no ballots yet), and the electoral roll is sent only if it was changed:
 * saving a new title must not enrol anybody.
 */
const ElectionEditor = (props: { fullVote?: FullVoteResponseModel }) => {
  const navigate = useNavigate();
  const existing = props.fullVote?.vote.vote;
  const creating = !existing;

  const [saved, setSaved] = useState(props.fullVote);
  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(ElectionFormSchema),
    defaultValues: valuesOf(props.fullVote),
    mode: 'onTouched',
  });
  const { register, control, handleSubmit, formState, watch, reset } = form;
  const { errors, isDirty, isSubmitting } = formState;

  const [roll, setRoll] = useState<RollChoice>(EMPTY_ROLL);
  const [replacingRoll, setReplacingRoll] = useState(creating);
  const [rollTouched, setRollTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const start = parseInputValue(watch('start'));
  const end = parseInputValue(watch('end'));

  const changeRoll = (next: RollChoice) => {
    setRoll(next);
    setRollTouched(true);
  };

  const onSubmit = async (values: ElectionFormValues) => {
    const problem = replacingRoll ? rollProblem(roll) : null;
    if (problem) {
      toast.error(problem, { id: 'roll_problem' });
      return;
    }
    try {
      if (creating) {
        const body: VoteCreationModel = { ...request(values), ...rollToRequest(roll) };
        const { data } = await apiClient().vote.createVote(body);
        toast.success('Élection créée', { id: 'vote_created' });
        // to the page of the election just made: staying on an empty-looking form invites a second click, and a second election
        navigate(routesBuilders.build({ voteId: data.vote.vote.id }, routes.VOTE_ADMINISTRATION), { replace: true });
        return;
      }
      const body: VoteUpdateModel = { ...request(values), ...(replacingRoll ? rollToRequest(roll) : {}) };
      const { data } = await apiClient().vote.updateVote(existing.id, body);
      setSaved(data);
      reset(valuesOf(data));
      setReplacingRoll(false);
      setRoll(EMPTY_ROLL);
      setRollTouched(false);
      toast.success('Modifications enregistrées', { id: 'vote_updated' });
    } catch (err) {
      console.error('Saving the election failed:', err);
      const code = (err as { response?: { data?: { detail?: { code?: string } } } })?.response?.data?.detail?.code;
      const message =
        code === 'VOTE_STARTED_CANNOT_UPDATE' || code === 'VOTE_FINISHED_CANNOT_UPDATE'
          ? "Cette élection est ouverte : elle ne peut plus être modifiée."
          : creating
            ? "L'élection n'a pas pu être créée."
            : "Les modifications n'ont pas pu être enregistrées.";
      toast.error(message, { id: 'vote_save_failed' });
    }
  };

  const remove = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await apiClient().vote.deleteVote(existing.id);
      toast.success('Élection supprimée', { id: 'vote_deleted' });
      navigate(routes.VOTES_ADMINISTRATION, { replace: true });
    } catch (err) {
      console.error('Deleting the election failed:', err);
      toast.error("L'élection n'a pas pu être supprimée.", { id: 'vote_deletion_failed' });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const unsaved = isDirty || rollTouched;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error('Corrigez les champs signalés.', { id: 'form_validation_error' }))}
      noValidate
      className='mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28 pt-2'
    >
      <header className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-center gap-3'>
          {existing && <VoteBadge type={getBadgeType(existing)} />}
          <p className='text-sm text-muted-foreground'>
            {creating ? 'Nouvelle élection' : `Élection n° ${existing.id}`}
          </p>
        </div>
        <h1 className='text-3xl font-semibold sm:text-4xl'>{creating ? 'Créer une élection' : saved?.vote.vote.title}</h1>
        <p className='max-w-2xl text-muted-foreground'>
          {creating
            ? "Définissez l'élection, ses candidats et qui peut voter. Elle ne pourra plus être modifiée une fois ouverte : les bulletins ont une entrée par candidat."
            : "Elle n'est pas encore ouverte : tout peut être changé. À l'ouverture, plus rien ne le pourra."}
        </p>
      </header>

      <Panel title='Informations' id='informations'>
        <div className='grid gap-4'>
          <FormField id='title' label='Titre' error={errors.title?.message}>
            <Input id='title' autoComplete='off' aria-invalid={!!errors.title} placeholder="Délégué de la promotion" {...register('title')} />
          </FormField>
          <FormField id='description' label='Description' error={errors.description?.message} hint='Ce que les électeurs lisent avant de voter.'>
            <Textarea id='description' rows={3} aria-invalid={!!errors.description} {...register('description')} />
          </FormField>
        </div>
      </Panel>

      <Panel
        title='Période'
        id='periode'
        description={`Heures de votre fuseau (${Intl.DateTimeFormat().resolvedOptions().timeZone}). Les électeurs voient les leurs.`}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='start' label='Ouverture' error={errors.start?.message}>
            <Input id='start' type='datetime-local' aria-invalid={!!errors.start} {...register('start')} />
          </FormField>
          <FormField id='end' label='Clôture' error={errors.end?.message}>
            <Input id='end' type='datetime-local' aria-invalid={!!errors.end} {...register('end')} />
          </FormField>
        </div>
        {start && end && end > start && (
          <p className='mt-4 text-sm text-muted-foreground'>
            Le vote reste ouvert <strong className='font-semibold text-foreground'>{formatDuration(end, start)}</strong>. Le
            décompte est publié à la clôture.
          </p>
        )}
      </Panel>

      <Panel
        title='Candidats'
        id='candidats'
        description='Chaque électeur choisit un candidat, ou vote blanc.'
      >
        <CandidatesEditor control={control} register={register} errors={errors} />
      </Panel>

      <Panel
        title='Liste électorale'
        id='electeurs'
        description='Qui peut voter. Une fois l’élection ouverte, la liste ne change plus.'
        action={
          !creating && (
            <Button
              type='button'
              variant={replacingRoll ? 'outline' : 'secondary'}
              onClick={() => {
                setReplacingRoll((v) => !v);
                setRoll(EMPTY_ROLL);
                setRollTouched(false);
              }}
            >
              {replacingRoll ? 'Garder la liste actuelle' : 'Remplacer la liste'}
            </Button>
          )
        }
      >
        {!creating && !replacingRoll && existing && <CurrentRoll voteId={existing.id} />}
        {(creating || replacingRoll) && (
          <div className='flex flex-col gap-4'>
            {!creating && (
              <p className='rounded-xl bg-warning-soft px-4 py-3 text-sm'>
                La liste choisie ici <strong>remplace</strong> la liste actuelle à l'enregistrement.
              </p>
            )}
            <RollChooser value={roll} onChange={changeRoll} />
          </div>
        )}
      </Panel>

      <div className='fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur'>
        <div className='mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6'>
          <p className='min-w-0 flex-1 text-sm text-muted-foreground' aria-live='polite'>
            {errorCount > 0
              ? `${errorCount} champ${errorCount > 1 ? 's' : ''} à corriger`
              : creating
                ? 'Rien n’est créé tant que vous n’avez pas validé.'
                : unsaved
                  ? 'Modifications non enregistrées'
                  : 'Tout est enregistré'}
          </p>
          {!creating && (
            <Button type='button' variant='outline' className='text-destructive' onClick={() => setConfirmDelete(true)}>
              <LucideTrash2 /> Supprimer
            </Button>
          )}
          <Button type='submit' size='lg' disabled={isSubmitting || (!creating && !unsaved)}>
            {isSubmitting ? <Spinner /> : creating ? <LucideCalendarPlus /> : <LucideSave />}
            {creating ? "Créer l'élection" : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={(open) => !deleting && setConfirmDelete(open)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-2xl'>Supprimer cette élection ?</DialogTitle>
            <DialogDescription>
              « {saved?.vote.vote.title} » et ses candidats seront supprimés. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-2'>
            <Button type='button' variant='outline' disabled={deleting} onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button type='button' variant='destructive' disabled={deleting} onClick={remove}>
              {deleting ? <Spinner /> : <LucideTrash2 />} Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ElectionEditor;
