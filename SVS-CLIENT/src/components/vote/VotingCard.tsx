import apiClient from '@/api/client';
import type { Candidate, FullVoteResponseModel } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import UserAvatarWithUserName from '@/components/utils/UserAvatarWithUserName';
import CandidateCard from '@/components/vote/CandidateCard';
import { cn } from '@/lib/utils';
import { VoteBadgeType } from '@/utils/vote.utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const VotingCard = (props: { fullVote: FullVoteResponseModel }) => {
  const start_date = new Date(
    props.fullVote.vote.vote.start_date,
  ).toLocaleDateString();
  const end_date = new Date(
    props.fullVote.vote.vote.end_date,
  ).toLocaleDateString();
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
  const [winnerCount, setWinnerCount] = useState<number>(0);

  useEffect(() => {
    if (props.fullVote.vote.user_has_voted) {
      console.log('Disabling voting because user has already voted');
      if (!isVotingDisabled.value) {
        setIsVotingDisabled((p) => ({
          ...p,
          value: true,
        }));
      }
    }
  }, [isVotingDisabled, props.fullVote.vote.user_has_voted]);
  useEffect(() => {
    if (isVotingDisabled.value) return;
    const updateReste = () => {
      const now = new Date();
      const reste_jours = Math.ceil(
        (new Date(props.fullVote.vote.vote.end_date).getTime() -
          now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const reste_heures = Math.ceil(
        (new Date(props.fullVote.vote.vote.end_date).getTime() - now.getTime()) /
          (1000 * 60 * 60),
      );
      const reste_minutes = Math.ceil(
        (new Date(props.fullVote.vote.vote.end_date).getTime() - now.getTime()) /
          (1000 * 60),
      );

      if (reste_minutes < 0) {
        setIsVotingDisabled({
          value: true,
          state: VoteBadgeType.Finished,
        });
      }
      if (new Date(props.fullVote.vote.vote.end_date) < now) {
        setIsVotingDisabled({
          value: true,
          state: VoteBadgeType.Finished,
        });
        setReste({ message: 'Le vote est terminé', isEndingSoon: false });
        return;
      }
      if (new Date(props.fullVote.vote.vote.start_date) > now) {
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
  }, [props.fullVote, isVotingDisabled]);

  useEffect(() => {
    // Determine winner if vote is finished
    if (isVotingDisabled.state === VoteBadgeType.Finished) {
      let maxVotes = 0;
      props.fullVote.candidates.forEach((candidate) => {
        if ((candidate.vote_count ?? 0) > maxVotes) {
          maxVotes = candidate.vote_count ?? 0;
        }
      });
      if (maxVotes !== winnerCount) {
        setWinnerCount(maxVotes);
      }
    }
  }, [isVotingDisabled, props.fullVote.candidates, winnerCount]);
  return (
    <Card className='w-full p-4 overflow-hidden'>
      <CardTitle className='flex flex-col gap-4 justify-center items-center'>
        <div className='w-full flex flex-row gap-4 justify-between items-center'>
          <h1 className='text-4xl'>{props.fullVote.vote.vote.title}</h1>
          <VoteBadge type={isVotingDisabled.state} />
        </div>
        <div className='w-full flex flex-row gap-4 justify-between items-center'>
          <UserAvatarWithUserName user={props.fullVote.vote.vote.creator} />
          <p
            className={cn(
              'text-sm text-muted-foreground ',
              reste.isEndingSoon ? 'font-bold text-red-500' : '',
            )}
          >
            {reste.message}
          </p>
        </div>

        <div className='w-full flex flex-row gap-4 justify-between items-center'>
          <p className='text-sm text-muted-foreground'>Début: {start_date}</p>
          <p className='text-sm text-muted-foreground'>Fin: {end_date}</p>
        </div>
      </CardTitle>
      <CardContent>
        <p className='text-md text-muted-foreground'>
          {props.fullVote.vote.vote.description}
        </p>

        <div className='flex flex-col flex-nowrap justify-start items-center'>
          <h2 className='text-2xl font-semibold mt-6 mb-4 w-full'>Candidats</h2>
          {isVotingDisabled.state === VoteBadgeType.Finished ? (
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
                {props.fullVote.total_bulletins} bulletin(s) ont été
                comptabilisé(s).
              </p>

              <p className='text-muted-foreground mb-4 w-full'>
                {props.fullVote.vote.abstention_count > 0
                  ? `Il y a eu ${props.fullVote.vote.abstention_count} abstention(s).`
                  : 'Aucune abstention.'}
              </p>
            </>
          ) : props.fullVote.vote.user_has_voted ? (
            <p className='text-muted-foreground mb-4 w-full'>
              Vous avez déjà voté.
            </p>
          ) : (
            <p className='text-muted-foreground mb-4 w-full'>
              {props.fullVote.candidates.length >= 1
                ? 'Sélectionnez un candidat pour voter :'
                : 'Aucun candidat disponible pour ce vote.'}
            </p>
          )}
          <div className='flex flex-row flex-wrap gap-8 justify-center items-center'>
            {props.fullVote.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selected={selectedCandidate === candidate}
                disabled={isVotingDisabled.value}
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
              />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardAction className='w-full flex flex-row flex-nowrap justify-end items-center'>
          <Button
            disabled={isVotingDisabled.value || selectedCandidate === null}
            onClick={() => {
              if (selectedCandidate === null) return;
              setIsVotingDisabled((p) => ({ ...p, value: true }));
              apiClient()
                .vote.vote(props.fullVote.vote.vote.id, {
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
            {props.fullVote.vote.user_has_voted ? 'Déjà voté' : 'Voter'}
          </Button>
        </CardAction>
      </CardFooter>
    </Card>
  );
};

export default VotingCard;
