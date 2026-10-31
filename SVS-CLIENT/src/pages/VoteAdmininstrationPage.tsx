import apiClient from '@/api/client';
import type { FullVoteResponseModel } from '@/api/sdk/api';
import { Spinner } from '@/components/ui/spinner';
import AppContainer from '@/components/utils/AppContainer';
import ElectionEditor from '@/components/vote/editor/ElectionEditor';
import ElectionView from '@/components/vote/ElectionView';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

/** An election, for its administrators: to make (no id), to change while it has not opened, to look at once it has. */
const VoteAdministrationPage = () => {
  const { voteId } = useParams();
  const [vote, setVote] = useState<FullVoteResponseModel | null>(null);
  const [failed, setFailed] = useState(false);

  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label: voteId ? (vote?.vote.vote.title ?? `Élection ${voteId}`) : 'Nouvelle élection',
      links: [],
    }),
  });

  useEffect(() => {
    if (!voteId) return;
    setVote(null);
    setFailed(false);
    apiClient()
      .vote.getVoteById(Number(voteId))
      .then((res) => setVote(res.data))
      .catch((err) => {
        console.error('Failed to fetch the election:', err);
        setFailed(true);
        toast.error("L'élection n'a pas pu être chargée.", { id: 'fetch_vote_details_error' });
      });
  }, [voteId]);

  // an election can be changed only until it opens (the server says no after: the ballots have an entry for each candidate)
  const opened = vote ? new Date(vote.vote.vote.start_date) <= new Date() : false;

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <div className='py-4'>
        {!voteId ? (
          <ElectionEditor />
        ) : failed ? (
          <p className='text-center text-muted-foreground'>Cette élection n'existe pas, ou vous n'avez pas le droit de la voir.</p>
        ) : !vote ? (
          <div className='flex justify-center py-16'>
            <Spinner />
          </div>
        ) : opened ? (
          <ElectionView fullVote={vote} readOnly />
        ) : (
          // keyed: another election is another form, not the same form with other values
          <ElectionEditor key={vote.vote.vote.id} fullVote={vote} />
        )}
      </div>
    </AppContainer>
  );
};

export default VoteAdministrationPage;
