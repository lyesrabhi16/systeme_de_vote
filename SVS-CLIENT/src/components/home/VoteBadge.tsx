import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VoteBadgeType } from '@/utils/vote.utils';
import { LucideCheck, LucideHourglass, LucideX } from 'lucide-react';

const VoteBadge = (props: {
  type: VoteBadgeType;
  userAlreadyVoted?: boolean;
}) => {
  const finishedStyle = {
    className: 'bg-green-500 text-primary-foreground px-4 py-2',
    icon: LucideCheck,
    text: 'Terminé',
  };
  const ongoingStyle = {
    className: `${props.userAlreadyVoted ? 'bg-green-500' : 'bg-primary'} text-primary-foreground px-4 py-2`,
    icon: LucideHourglass,
    text: `En cours${props.userAlreadyVoted ? ' (voté)' : ''}`,
  };
  const upcomingStyle = {
    className: 'bg-accent text-accent-foreground px-4 py-2',
    icon: LucideHourglass,
    text: 'À venir',
  };
  const finishedWithoutVotingStyle = {
    className: 'bg-destructive text-destructive-foreground px-4 py-2',
    icon: LucideX,
    text: 'Terminé <span class="hidden sm:inline">(Abstention)</span>',
  };
  let style;
  switch (props.type) {
    case 'finished':
      style = finishedStyle;
      break;
    case 'ongoing':
      style = ongoingStyle;
      break;
    case 'upcoming':
      style = upcomingStyle;
      break;
    case 'finished_without_voting':
      style = finishedWithoutVotingStyle;
      break;
    default:
      style = ongoingStyle;
  }

  return (
    <Badge className={cn('flex flex-row gap-2 items-center', style.className)}>
      <style.icon />
      <span dangerouslySetInnerHTML={{ __html: style.text }} />
    </Badge>
  );
};

export default VoteBadge;
