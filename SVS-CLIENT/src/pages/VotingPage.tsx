import AppContainer from '@/components/utils/AppContainer';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { useParams } from 'react-router';

const VotingPage = () => {
  const { voteId } = useParams();
  const Breadcrumbs = useBreadCrumbs({
    additionalLabel: () => {
      return { label: `${voteId}`, link: `/vote/${voteId}` };
    },
  });

  return (
    <AppContainer noBreadcrumbs>
      <Breadcrumbs />
      <h1>Voting Page for Vote ID: {voteId}</h1>
    </AppContainer>
  );
};

export default VotingPage;
