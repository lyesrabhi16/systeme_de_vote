import apiClient from '@/api/client';
import type { FullVoteResponseModel } from '@/api/sdk';
import { Spinner } from '@/components/ui/spinner';
import AppContainer from '@/components/utils/AppContainer';
import VotingCard from '@/components/vote/VotingCard';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

const VotingPage = () => {
  const { voteId } = useParams();
  const Breadcrumbs = useBreadCrumbs({
    additionalLabel: () => {
      return { label: `${voteId}`, link: `/vote/${voteId}` };
    },
  });
  const [vote, setVote] = useState<FullVoteResponseModel | null>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // Fetch vote data based on voteId
    const fetchVote = async () => {
      apiClient()
        .vote.getVoteById(parseInt(voteId || '0'))
        .then((response) => {
          setVote(response.data);
        })
        .catch((error) => {
          console.error('Error fetching vote:', error);
          setVote(null);
          setFailed(true);
        });
    };

    fetchVote();
  }, [voteId]);

  return (
    <AppContainer noBreadcrumbs>
      <Breadcrumbs />
      <div className='w-full p-8 flex flex-col gap-6 items-center justify-center'>
        {vote ? (
          <VotingCard fullVote={vote} />
        ) : failed ? (
          <p>Echec de chargement des détails du vote.</p>
        ) : (
          <Spinner>Loading vote details...</Spinner>
        )}
      </div>
    </AppContainer>
  );
};

export default VotingPage;
