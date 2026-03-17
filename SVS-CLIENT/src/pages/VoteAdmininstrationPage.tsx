import apiClient from '@/api/client';
import type { FullVoteResponseModel } from '@/api/sdk/api';
import { Spinner } from '@/components/ui/spinner';
import AppContainer from '@/components/utils/AppContainer';
import VotingCard from '@/components/vote/VotingCard';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
const VoteAdministrationPage = () => {
  const pathParams = useParams();
  const [pageType, setPageType] = useState<'create' | 'edit' | 'readonly'>(
    pathParams.voteId ? 'readonly' : 'create',
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
    if (pageType === 'create') return;
    // Fetch vote details if voteId is present
    apiClient()
      .vote.getVoteById(Number(pathParams.voteId))
      .then((res) => {
        setVote(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch vote details:', err);
        toast.error('Échec de la récupération des détails du vote', {
          id: 'fetch_vote_details_error',
        });
      });
    //console.log('Page type:', pageType);
  }, []);
  useEffect(() => {
    if (pageType === 'create') return;
    if (!vote) return;

    const now = new Date();
    const vote_start_date = new Date(vote.vote.vote.start_date);
    const vote_end_date = new Date(vote.vote.vote.end_date);
    if (vote_end_date < now) {
      toast.warning(
        'Ce vote est déjà terminé. Vous ne pouvez plus le modifier.',
        {
          id: 'vote_ended_warning',
        },
      );
    } else if (vote_start_date < now) {
      toast.warning(
        'Ce vote est déjà commencé. Vous ne pouvez plus le modifier.',
        {
          id: 'vote_started_warning',
        },
      );
    } else {
      //console.log('Enabling edit mode for vote');
      setPageType((prev) => (prev === 'readonly' ? 'edit' : prev));
    }
  }, [vote]);
  useEffect(() => {
    console.log(pageType);
  }, [pageType]);
  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <div className='mt-6 w-full p-2 flex flex-col items-center justify-center'>
        {pageType === 'create' && (
          <>
            <VotingCard editable mode='create' flat />
          </>
        )}
        {(pageType === 'edit' || pageType === 'readonly') &&
          (vote ? (
            <VotingCard
              fullVote={vote}
              editable={pageType === 'edit'}
              mode={pageType}
              flat
            />
          ) : (
            <Spinner />
          ))}
      </div>
    </AppContainer>
  );
};

export default VoteAdministrationPage;
