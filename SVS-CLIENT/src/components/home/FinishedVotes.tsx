import apiClient from '@/api/client';
import type { FinishedVoteResponseModel } from '@/api/sdk';
import Section, { EmptyState } from '@/components/home/Section';
import VoteRowCard from '@/components/home/VoteRowCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideHistory } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const VISIBLE = 4;

const winnerOf = (vote: FinishedVoteResponseModel) => {
  if (!vote.vote.has_been_counted) return 'N/A';
  const winners = (vote.candidates ?? []).filter(
    (c) => c.id !== undefined && c.id !== null && vote.winner_candidates?.includes(c.id),
  );
  return winners.length === 0 ? 'N/A' : winners.map((c) => `${c.first_name} ${c.last_name}`).join(', ');
};

const FinishedVotes = () => {
  const [votes, setVotes] = useState<FinishedVoteResponseModel[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    apiClient()
      .vote.getFinishedVotes()
      .then((response) => setVotes(response.data))
      .catch((error) => {
        console.error('Error fetching finished votes:', error);
        setVotes([]);
        toast.error('Erreur lors de la récupération des votes terminés.', {
          id: 'fetch_finished_votes_error',
        });
      });
  }, []);

  const sorted = [...(votes ?? [])].sort(
    (a, b) => new Date(b.vote.end_date).getTime() - new Date(a.vote.end_date).getTime(),
  );
  const shown = all ? sorted : sorted.slice(0, VISIBLE);

  return (
    <Section id='history' title='Historique' hint={sorted.length > 0 ? `${sorted.length} élection${sorted.length > 1 ? 's' : ''}` : undefined}>
      {votes === null ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {[0, 1].map((i) => (
            <Skeleton key={i} className='h-28 rounded-2xl' />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState icon={<LucideHistory />} title='Aucune élection terminée'>
          Les résultats des élections auxquelles vous avez participé seront conservés ici.
        </EmptyState>
      ) : (
        <>
          <div className='grid gap-3 md:grid-cols-2'>
            {shown.map((item) => (
              <VoteRowCard
                key={item.vote.id}
                vote={item.vote}
                userHasVoted={item.user_has_voted}
                winner={winnerOf(item)}
              />
            ))}
          </div>
          {sorted.length > VISIBLE && (
            <Button variant='ghost' className='self-center' onClick={() => setAll((v) => !v)}>
              {all ? 'Voir moins' : `Voir les ${sorted.length - VISIBLE} autres`}
            </Button>
          )}
        </>
      )}
    </Section>
  );
};

export default FinishedVotes;
