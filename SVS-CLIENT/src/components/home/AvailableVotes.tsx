import apiClient from '@/api/client';
import type { VoteResponseModel } from '@/api/sdk';
import Section, { EmptyState } from '@/components/home/Section';
import VoteCard from '@/components/home/VoteCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getBadgeType, VoteBadgeType } from '@/utils/vote.utils';
import { LucideInbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const VISIBLE = 6;

const AvailableVotes = () => {
  const [votes, setVotes] = useState<VoteResponseModel[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    apiClient()
      .vote.getAvailableVotes()
      .then((response) => setVotes(response.data))
      .catch((error) => {
        console.error('Error fetching available votes:', error);
        setVotes([]);
        toast.error('Erreur lors de la récupération des votes disponibles.', {
          id: 'fetch_available_votes_error',
        });
      });
  }, []);

  // those that can be voted in now first (the one that ends first at the top), then those to come
  const sorted = [...(votes ?? [])].sort((a, b) => {
    const open = (v: VoteResponseModel) => (getBadgeType(v) === VoteBadgeType.Ongoing ? 0 : 1);
    return open(a) - open(b) || new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });
  const toVote = sorted.filter((v) => getBadgeType(v) === VoteBadgeType.Ongoing).length;
  const shown = all ? sorted : sorted.slice(0, VISIBLE);

  return (
    <Section
      id='available'
      title='À voter'
      hint={
        votes && votes.length > 0
          ? `${toVote} en cours${votes.length - toVote > 0 ? `, ${votes.length - toVote} à venir` : ''}`
          : undefined
      }
    >
      {votes === null ? (
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-56 rounded-2xl' />
          ))}
        </div>
      ) : votes.length === 0 ? (
        <EmptyState icon={<LucideInbox />} title='Rien à voter pour le moment'>
          Les élections auxquelles vous êtes inscrit apparaîtront ici dès qu'elles seront créées.
        </EmptyState>
      ) : (
        <>
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {shown.map((vote, index) => (
              <VoteCard key={vote.id} vote={vote} index={index} />
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

export default AvailableVotes;
