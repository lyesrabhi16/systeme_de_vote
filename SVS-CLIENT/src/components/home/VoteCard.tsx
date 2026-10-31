import type { VoteResponseModel } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { routesBuilders } from '@/services/routing';
import { formatDate, formatDuration, progressBetween } from '@/utils/dates';
import { getBadgeType, VoteBadgeType } from '@/utils/vote.utils';
import { LucideArrowRight, LucideCalendar } from 'lucide-react';
import { Link } from 'react-router';

/** An election the voter can vote in (or will be able to): what it is, how long is left, and the way in. */
const VoteCard = (props: {
  vote: VoteResponseModel;
  index?: number;
  userHasVoted?: boolean;
}) => {
  const { vote } = props;
  const type = getBadgeType(vote, props.userHasVoted);
  const open = type === VoteBadgeType.Ongoing;
  const progress = Math.round(progressBetween(vote.start_date, vote.end_date) * 100);

  return (
    <Card className='group h-full gap-4 transition-shadow duration-200 hover:shadow-md'>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <CardTitle className='font-display text-xl leading-snug'>{vote.title}</CardTitle>
          <VoteBadge type={type} userAlreadyVoted={props.userHasVoted} />
        </div>
        <CardDescription className='line-clamp-2 min-h-10'>{vote.description}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <LucideCalendar className='size-4' />
          {formatDate(vote.start_date)} → {formatDate(vote.end_date)}
        </p>
        {open && (
          <div className='flex flex-col gap-1.5'>
            <div
              className='h-1.5 overflow-hidden rounded-full bg-secondary'
              role='progressbar'
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label='Avancement de la période de vote'
            >
              <div className='h-full rounded-full bg-primary transition-[width]' style={{ width: `${progress}%` }} />
            </div>
            <p className='text-xs text-muted-foreground'>
              Se termine dans <strong className='font-semibold text-foreground'>{formatDuration(vote.end_date)}</strong>
            </p>
          </div>
        )}
        {type === VoteBadgeType.Upcoming && (
          <p className='text-xs text-muted-foreground'>
            Ouvre dans <strong className='font-semibold text-foreground'>{formatDuration(vote.start_date)}</strong>
          </p>
        )}
      </CardContent>
      <CardFooter className='mt-auto'>
        {open ? (
          <Button asChild className='w-full sm:w-auto sm:ml-auto'>
            <Link to={routesBuilders.getVoteRoute(vote.id)}>
              Voter <LucideArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild variant='outline' className='w-full sm:w-auto sm:ml-auto'>
            <Link to={routesBuilders.getVoteRoute(vote.id)}>Voir les candidats</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VoteCard;
