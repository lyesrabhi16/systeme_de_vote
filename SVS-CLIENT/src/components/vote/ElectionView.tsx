import type { Candidate, FullVoteResponseModel } from '@/api/sdk';
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
import { Spinner } from '@/components/ui/spinner';
import CandidateAvatar from '@/components/vote/CandidateAvatar';
import CandidateOption from '@/components/vote/CandidateOption';
import { candidateName } from '@/utils/candidate.utils';
import ReceiptDialog from '@/components/vote/ReceiptDialog';
import ResultsPanel from '@/components/vote/ResultsPanel';
import VerifyPanel from '@/components/vote/VerifyPanel';
import UserAvatarWithUserName from '@/components/utils/UserAvatarWithUserName';
import { useNow } from '@/hooks/useNow';
import { interpretCastError } from '@/services/voting/errors';
import { castVote } from '@/services/voting/voting';
import { formatDateTime, formatDuration, progressBetween } from '@/utils/dates';
import { getBadgeType, VoteBadgeType } from '@/utils/vote.utils';
import {
  LucideCalendarClock,
  LucideCircleCheck,
  LucideEye,
  LucideHourglass,
  LucideLockKeyhole,
  LucideSquareDashed,
  LucideVote,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const BLANK = 'blank';

/** An election, as a voter sees it: to vote in, to wait for, or to read the result of. */
const ElectionView = (props: {
  fullVote: FullVoteResponseModel;
  /** An administrator looking at it: no ballot is offered (it is for the people on the roll, and the server would refuse) */
  readOnly?: boolean;
}) => {
  const { fullVote } = props;
  const election = fullVote.vote.vote;
  const now = useNow();

  const [alreadyVoted, setAlreadyVoted] = useState(fullVote.vote.user_has_voted);
  const [choice, setChoice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [closedByServer, setClosedByServer] = useState(false);

  const type = getBadgeType(election, alreadyVoted);
  const open = type === VoteBadgeType.Ongoing && !closedByServer;
  const upcoming = type === VoteBadgeType.Upcoming;
  const finished = !open && !upcoming;
  const counted = election.has_been_counted;
  const canVote = open && !alreadyVoted && !props.readOnly;

  const candidates = fullVote.candidates;
  const selected: Candidate | null | undefined =
    choice === null || choice === BLANK ? null : candidates.find((c) => String(c.id) === choice);
  const choiceLabel = choice === BLANK ? 'Vote blanc' : selected ? candidateName(selected) : '';
  const progress = Math.round(progressBetween(election.start_date, election.end_date, now) * 100);

  const submit = async () => {
    if (choice === null) return;
    setSubmitting(true);
    try {
      const response = await castVote(election, candidates, choice === BLANK ? null : Number(choice));
      setConfirming(false);
      setAlreadyVoted(true);
      setReceipt(response.data.unique_code);
    } catch (err) {
      console.error('Error while voting:', err);
      const failure = interpretCastError(err);
      toast.error(failure.message, { id: 'vote_cast_error' });
      setConfirming(false);
      if (failure.alreadyVoted) setAlreadyVoted(true);
      if (failure.closed) setClosedByServer(true);
      if (failure.final) setChoice(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-8 pb-28 pt-2'>
      {/* header */}
      <header className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-center gap-3'>
          <VoteBadge type={closedByServer ? VoteBadgeType.Finished : type} userAlreadyVoted={alreadyVoted} />
          <UserAvatarWithUserName
            user={election.creator}
            containerClassName='justify-start'
            avatarClassName='size-7'
          />
        </div>
        <h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>{election.title}</h1>
        {election.description && <p className='max-w-2xl text-lg text-muted-foreground'>{election.description}</p>}
        <dl className='flex flex-wrap gap-x-8 gap-y-2 text-sm'>
          <div>
            <dt className='text-xs uppercase tracking-wide text-muted-foreground'>Ouverture</dt>
            <dd className='font-medium'>{formatDateTime(election.start_date)}</dd>
          </div>
          <div>
            <dt className='text-xs uppercase tracking-wide text-muted-foreground'>Clôture</dt>
            <dd className='font-medium'>{formatDateTime(election.end_date)}</dd>
          </div>
        </dl>
        {open && (
          <div className='flex flex-col gap-1.5'>
            <div
              className='h-1.5 overflow-hidden rounded-full bg-secondary'
              role='progressbar'
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Avancement de l'élection"
            >
              <div className='h-full rounded-full bg-primary' style={{ width: `${progress}%` }} />
            </div>
            <p className='text-sm text-muted-foreground'>
              Se termine dans <strong className='font-semibold text-foreground'>{formatDuration(election.end_date, now)}</strong>
            </p>
          </div>
        )}
      </header>

      {/* banners */}
      {props.readOnly && (
        <div className='flex items-start gap-3 rounded-2xl border bg-muted/60 p-4' role='note'>
          <LucideEye className='mt-0.5 size-5 shrink-0' />
          <p>
            Vue de l'administration. L'élection a commencé : ses candidats et sa liste ne peuvent plus changer, et le vote est réservé
            aux électeurs inscrits.
          </p>
        </div>
      )}
      {alreadyVoted && open && (
        <div className='flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success' role='status'>
          <LucideCircleCheck className='mt-0.5 size-5 shrink-0' />
          <div>
            <p className='font-medium'>Vous avez voté.</p>
            <p className='text-sm opacity-90'>
              Votre reçu vous a été envoyé par e-mail ; vous pouvez retrouver votre bulletin ci-dessous. Le résultat sera publié à la clôture.
            </p>
          </div>
        </div>
      )}
      {upcoming && (
        <div className='flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4' role='status'>
          <LucideCalendarClock className='mt-0.5 size-5 shrink-0' />
          <p>
            Cette élection ouvre dans <strong>{formatDuration(election.start_date, now)}</strong>. Vous pourrez voter à partir
            du {formatDateTime(election.start_date)}.
          </p>
        </div>
      )}
      {finished && !counted && (
        <div className='flex items-start gap-3 rounded-2xl border bg-muted/60 p-4' role='status'>
          <LucideHourglass className='mt-0.5 size-5 shrink-0' />
          <p>Le vote est terminé. Le décompte est en cours : le résultat apparaîtra ici dans quelques instants.</p>
        </div>
      )}

      {/* the result */}
      {finished && counted && <ResultsPanel fullVote={fullVote} />}

      {/* the ballot, or the candidates */}
      {!(finished && counted) && (
        <section aria-labelledby='candidats' className='flex flex-col gap-4'>
          <div>
            <h2 id='candidats' className='text-2xl font-semibold'>
              {canVote ? 'Votre choix' : 'Candidats'}
            </h2>
            {canVote && (
              <p className='mt-1 text-sm text-muted-foreground'>
                Sélectionnez un candidat, ou le vote blanc. Vous ne pourrez pas modifier votre vote.
              </p>
            )}
          </div>
          {candidates.length === 0 ? (
            <p className='text-muted-foreground'>Aucun candidat pour cette élection.</p>
          ) : canVote ? (
            <fieldset className='grid gap-3'>
              <legend className='sr-only'>Candidats</legend>
              {candidates.map((candidate) => (
                <CandidateOption
                  key={candidate.id}
                  name='choice'
                  value={String(candidate.id)}
                  label={candidateName(candidate)}
                  candidate={candidate}
                  checked={choice === String(candidate.id)}
                  onSelect={() => setChoice(String(candidate.id))}
                />
              ))}
              <CandidateOption
                name='choice'
                value={BLANK}
                label='Vote blanc'
                checked={choice === BLANK}
                onSelect={() => setChoice(BLANK)}
              >
                <span className='flex size-12 items-center justify-center rounded-full border border-dashed text-muted-foreground'>
                  <LucideSquareDashed className='size-5' />
                </span>
              </CandidateOption>
            </fieldset>
          ) : (
            <ul className='grid gap-3 sm:grid-cols-2'>
              {candidates.map((candidate) => (
                <li key={candidate.id} className='flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs'>
                  <CandidateAvatar candidate={candidate} />
                  <span className='font-medium'>{candidateName(candidate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(alreadyVoted || (finished && counted)) && <VerifyPanel voteId={election.id} counted={counted} />}

      {/* the bar to confirm */}
      {canVote && (
        <div className='fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur'>
          <div className='mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6'>
            <p className='min-w-0 flex-1 truncate text-sm'>
              {choice === null ? (
                <span className='text-muted-foreground'>Aucun choix sélectionné</span>
              ) : (
                <>
                  <span className='text-muted-foreground'>Votre choix : </span>
                  <strong className='font-semibold'>{choiceLabel}</strong>
                </>
              )}
            </p>
            <Button size='lg' disabled={choice === null} onClick={() => setConfirming(true)}>
              <LucideVote /> Voter
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirming} onOpenChange={(o) => !submitting && setConfirming(o)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-2xl'>Confirmer votre vote</DialogTitle>
            <DialogDescription>
              Vous allez voter pour <strong className='text-foreground'>{choiceLabel}</strong>. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <p className='flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground'>
            <LucideLockKeyhole className='mt-0.5 size-4 shrink-0' />
            Votre navigateur chiffre le bulletin et prouve qu'il est valide avant de l'envoyer.
          </p>
          <DialogFooter className='gap-2 sm:gap-2'>
            <Button variant='outline' disabled={submitting} onClick={() => setConfirming(false)}>
              Modifier
            </Button>
            <Button disabled={submitting} onClick={submit}>
              {submitting ? (
                <>
                  <Spinner /> Chiffrement…
                </>
              ) : (
                'Confirmer mon vote'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog code={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
};

export default ElectionView;
