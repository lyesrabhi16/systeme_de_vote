import apiClient from '@/api/client';
import type { Vote } from '@/api/sdk';
import VoteCard from '@/components/home/VoteCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const AvailableVotes = () => {
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    // Fetch available votes from API or service
    const fetchAvailableVotes = async () => {
      apiClient()
        .vote.getAvailableVotes()
        .then((response) => {
          setVotes([...response.data, ...response.data, ...response.data]);
        })
        .catch((error) => {
          console.error('Error fetching available votes:', error);
          toast.error('Erreur lors de la récupération des votes disponibles.');
        });
    };

    fetchAvailableVotes();
  }, []);

  return (
    <div className='w-full p-2'>
      <h3 className='text-2xl font-semibold mb-2'>Vos votes disponibles</h3>
      <div className='p-4'>
        {votes.length === 0 && (
          <p>Vous n'avez pas de votes disponibles pour le moment.</p>
        )}
        {votes.length > 0 && (
          <>
            <div className='flex flex-row flex-wrap gap-8 justify-center items-start scroll-smooth py-4 w-full group'>
              {votes
                .sort(
                  (a, b) =>
                    new Date(a.end_date).getTime() -
                    new Date(b.end_date).getTime(),
                )
                .slice(0, 3)
                .map((vote, index) => (
                  <VoteCard key={vote.id} vote={vote} index={index} />
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
                  <div className='flex flex-col justify-center items-center gap-4'>
                    <h1 className='text-2xl font-semibold mb-4 self-start'>
                      Votes disponibles
                    </h1>
                    {votes
                      .sort(
                        (a, b) =>
                          new Date(b.end_date).getTime() -
                          new Date(a.end_date).getTime(),
                      )
                      .map((vote) => (
                        <VoteCard key={vote.id} vote={vote} />
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

export default AvailableVotes;
