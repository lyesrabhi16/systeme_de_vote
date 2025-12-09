import apiClient from '@/api/client';
import type { FinishedVoteResponseModel } from '@/api/sdk';
import VoteRowCard from '@/components/home/VoteRowCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FinishedVotes = () => {
  const [votes, setVotes] = useState<FinishedVoteResponseModel[]>([]);

  useEffect(() => {
    // Fetch finished votes from API or service
    const fetchFinishedVotes = async () => {
      apiClient()
        .vote.getFinishedVotes()
        .then((response) => {
          setVotes(response.data);
        })
        .catch((error) => {
          console.error('Error fetching finished votes:', error);
          toast.error('Erreur lors de la récupération des votes terminés.');
        });
    };

    fetchFinishedVotes();
  }, []);

  return (
    <div className='w-full p-2'>
      <h3 className='text-2xl font-semibold mb-2'>Historique des votes</h3>
      <div className='p-4'>
        {votes.length === 0 && <p>Aucun vote terminé pour le moment.</p>}
        {votes.length > 0 && (
          <>
            <div className='flex flex-row flex-wrap gap-8 justify-center items-start scroll-smooth py-4 w-full group'>
              {votes
                .sort(
                  (a, b) =>
                    new Date(b.vote.end_date).getTime() -
                    new Date(a.vote.end_date).getTime(),
                )
                .slice(0, 3)
                .map((finishedVote) => (
                  <VoteRowCard
                    key={finishedVote.vote.id}
                    vote={finishedVote.vote}
                    userHasVoted={finishedVote.user_has_voted}
                  />
                ))}
            </div>

            {votes.length > 3 && (
              <Dialog>
                <DialogTrigger asChild>
                  <div className='mt-2 flex items-center justify-end'>
                    <Button variant='ghost'>
                      Voir plus ({votes.length - 3})
                    </Button>
                  </div>
                </DialogTrigger>
                <DialogContent className='max-w-4xl px-8 py-4 m-4 overflow-y-scroll max-h-[80vh]'>
                  <div className='flex flex-col gap-4'>
                    <h1 className='text-2xl font-semibold mb-4'>
                      Historique des votes
                    </h1>
                    {votes
                      .sort(
                        (a, b) =>
                          new Date(b.vote.end_date).getTime() -
                          new Date(a.vote.end_date).getTime(),
                      )
                      .map((finishedVote) => (
                        <VoteRowCard
                          key={finishedVote.vote.id}
                          vote={finishedVote.vote}
                          userHasVoted={finishedVote.user_has_voted}
                        />
                      ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinishedVotes;
