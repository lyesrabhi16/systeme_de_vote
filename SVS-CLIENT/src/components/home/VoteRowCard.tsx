import type { Vote } from '@/api/sdk';
import VoteBadge from '@/components/home/VoteBadge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { getBadgeType } from '@/utils/vote.utils';
import { LucideArrowRightFromLine } from 'lucide-react';

const VoteRowCard = (props: {
  vote: Vote;
  userHasVoted?: boolean;
}) => {
  const { vote } = props;
  const start = new Date(vote.start_date).toLocaleDateString();
  const end = new Date(vote.end_date).toLocaleDateString();

  return (
    <Card className='w-full flex items-start gap-4 p-4 rounded-lg shadow-sm hover:scale-110 transition-transform duration-200'>
      <CardTitle className='font-semibold text-base truncate flex flex-row flex-nowrap justify-between items-center w-full'>
        {vote.title}
        <VoteBadge
          type={
            getBadgeType(vote, props.userHasVoted)
          }
        />
      </CardTitle>
      <CardDescription className='text-sm text-muted-foreground truncate mt-1'>
        <div className='hidden sm:block text-sm text-muted-foreground whitespace-nowrap'>
          {start} — {end}
        </div>
        {vote.description}
      </CardDescription>

      <div className='flex flex-row justify-between items-center w-full mt-4'>
        <p className='text-sm text-muted-foreground mb-2 hidden sm:block'>
          Élu : {'N/A'}
        </p>
        <Button variant='default'>
          Détails
          <LucideArrowRightFromLine className='w-4 h-4 mr-2' />
        </Button>
      </div>
    </Card>
  );
};

export default VoteRowCard;
