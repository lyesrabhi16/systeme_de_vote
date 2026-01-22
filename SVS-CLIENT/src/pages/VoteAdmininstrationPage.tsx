import apiClient from '@/api/client';
import type { FullVoteResponseModel } from '@/api/sdk/api';
import { Spinner } from '@/components/ui/spinner';
import AppContainer from '@/components/utils/AppContainer';
import VotingCard from '@/components/vote/VotingCard';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

const VoteAdmininstrationPage = () => {
  const pathParams = useParams();
  const [pageType] = useState<'create' | 'edit'>(
    pathParams.voteId ? 'edit' : 'create',
  );
  const [vote, setVote] = useState<FullVoteResponseModel | null>(null);
  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label:
        'Vote: ' + (pathParams.voteId ? vote?.vote.vote.title : 'Nouveau Vote'),
      links: [],
    }),
  });
  useEffect(() => {
    // Fetch vote details if voteId is present
    if (pageType === 'create') return;
    apiClient()
      .vote.getVoteById(Number(pathParams.voteId))
      .then((res) => {
        setVote(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch vote details:', err);
        toast.error('Échec de la récupération des détails du vote');
      });
  }, []);

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <div className='mt-6 w-full p-2 flex flex-col items-center justify-center'>
        {pageType === 'create' && (
          <>
            <VotingCard editable flat />
          </>
        )}
        {pageType === 'edit' &&
          (vote ? <VotingCard fullVote={vote} editable flat /> : <Spinner />)}
      </div>
    </AppContainer>
  );
};

export default VoteAdmininstrationPage;
