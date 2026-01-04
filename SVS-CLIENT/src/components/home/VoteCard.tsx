import type { Vote } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { routesBuilders } from '@/services/routing';
import { getBadgeType, VoteBadgeType } from '@/utils/vote.utils';
import { useNavigate } from 'react-router';

const VoteCard = (props: {
  vote: Vote;
  index?: number;
  userHasVoted?: boolean;
}) => {
  const navigate = useNavigate();
  const badgeType = getBadgeType(props.vote, props.userHasVoted);
  const disabledCardStyle = 'opacity-50 cursor-not-allowed';
  return (
    <Card
      className={`p-4 shadow-md rounded-lg transition-transform duration-200 sm:min-w-96 max-w-sm ${
        props.index === 0 && badgeType === VoteBadgeType.Ongoing
          ? 'scale-110 group-hover:scale-100'
          : badgeType === VoteBadgeType.Ongoing
          ? 'hover:scale-110'
          : ''
      } ${badgeType !== VoteBadgeType.Ongoing ? disabledCardStyle : ''}`}
    >
      <CardTitle className='font-bold text-lg mb-2 flex flex-row flex-wrap justify-between items-center'>
        <p>{props.vote.title}</p>
        <div className='ml-auto'>
          <VoteBadge type={badgeType} />
        </div>
      </CardTitle>
      <CardDescription className='text-sm text-muted-foreground'>
        {props.vote.description}
      </CardDescription>
      <CardContent>
        <div className='mt-4 flex-row flex-wrap gap-8 flex text-muted-foreground'>
          <p className='text-sm'>
            début: {new Date(props.vote.start_date).toLocaleDateString()}
          </p>
          <p className='text-sm'>
            fin: {new Date(props.vote.end_date).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <CardAction className='w-full flex justify-end'>
          <Button
            onClick={() =>
              props.vote.id &&
              navigate(routesBuilders.getVoteRoute(props.vote.id))
            }
            disabled={badgeType !== VoteBadgeType.Ongoing}
          >
            Voter
          </Button>
        </CardAction>
      </CardFooter>
      <CardAction></CardAction>
    </Card>
  );
};

export default VoteCard;
