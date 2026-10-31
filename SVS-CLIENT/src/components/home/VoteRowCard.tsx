import type { VoteWithCreatorResponseModel } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { routesBuilders } from '@/services/routing';
import { formatDate } from '@/utils/dates';
import { getBadgeType } from '@/utils/vote.utils';
import { LucideChevronRight, LucideTrophy } from 'lucide-react';
import { Link } from 'react-router';

/** A line of the history: an election that is over, who won, and the way to its result. */
const VoteRowCard = (props: {
  vote: VoteWithCreatorResponseModel;
  userHasVoted?: boolean;
  winner?: string;
}) => {
  const { vote } = props;
  const counted = props.winner && props.winner !== 'N/A';
  return (
    <Link
      to={routesBuilders.getVoteRoute(vote.id)}
      className='group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md'
    >
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <h4 className='truncate font-display text-lg font-semibold'>{vote.title}</h4>
          <VoteBadge
            type={getBadgeType({ ...vote, creator_id: vote.creator.id }, props.userHasVoted)}
            userAlreadyVoted={props.userHasVoted}
          />
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          {formatDate(vote.start_date)} → {formatDate(vote.end_date)}
        </p>
        <p className='mt-2 flex items-center gap-1.5 text-sm'>
          <LucideTrophy className='size-4 text-warning' />
          {counted ? (
            <span>
              <span className='text-muted-foreground'>Élu : </span>
              <strong className='font-semibold'>{props.winner}</strong>
            </span>
          ) : (
            <span className='text-muted-foreground'>Résultat pas encore publié</span>
          )}
        </p>
      </div>
      <LucideChevronRight className='size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
    </Link>
  );
};

export default VoteRowCard;
