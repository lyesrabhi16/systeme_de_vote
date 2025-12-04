import apiClient from '@/api/client';
import type { Vote } from '@/api/sdk';
import VoteCard from '@/components/home/VoteCard';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

const AvailableVotes = () => {
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    // Fetch available votes from API or service
    const fetchAvailableVotes = async () => {
      apiClient()
        .vote.getAvailableVotes()
        .then((response) => {
          setVotes(response.data);
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
              <div className='mt-2 flex items-center justify-end'>
                <Link to='/votes' aria-label='Voir plus de votes'>
                  <Button variant='ghost'>
                    Voir plus ({votes.length - 3})
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AvailableVotes;
