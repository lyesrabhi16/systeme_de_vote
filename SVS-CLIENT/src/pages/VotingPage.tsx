import apiClient from '@/api/client';
import type { FullVoteResponseModel } from '@/api/sdk';
import { Spinner } from '@/components/ui/spinner';
import AppContainer from '@/components/utils/AppContainer';
import ElectionView from '@/components/vote/ElectionView';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

const VotingPage = () => {
  const { voteId } = useParams();
  const Breadcrumbs = useBreadCrumbs({
    additionalLabel: () => {
      return { label: `${voteId}`, links: [`/vote/${voteId}`] };
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
      <div className='flex w-full flex-col items-center justify-center gap-6 py-4'>
        {vote ? (
          <ElectionView fullVote={vote} />
        ) : failed ? (
          <p className='text-muted-foreground'>Impossible de charger cette élection. Elle n'existe pas, ou vous n'y êtes pas inscrit.</p>
        ) : (
          <Spinner>Chargement de l'élection…</Spinner>
        )}
      </div>
    </AppContainer>
  );
};

export default VotingPage;
