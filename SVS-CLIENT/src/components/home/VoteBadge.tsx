import { Badge } from '@/components/ui/badge';
import { VoteBadgeType } from '@/utils/vote.utils';
import { LucideCheck, LucideClock, LucideCircleDot, LucideMinus } from 'lucide-react';

/** The state of an election, as a label: never by colour alone (there is an icon and a word). */
const VoteBadge = (props: {
  type: VoteBadgeType;
  userAlreadyVoted?: boolean;
}) => {
  switch (props.type) {
    case VoteBadgeType.Finished:
      return (
        <Badge variant='success' className='px-2.5 py-1'>
          <LucideCheck /> Terminé
        </Badge>
      );
    case VoteBadgeType.FinishedWithoutVoting:
      return (
        <Badge variant='muted' className='px-2.5 py-1'>
          <LucideMinus /> Terminé · abstention
        </Badge>
      );
    case VoteBadgeType.Upcoming:
      return (
        <Badge variant='warning' className='px-2.5 py-1'>
          <LucideClock /> À venir
        </Badge>
      );
    case VoteBadgeType.Ongoing:
    default:
      return (
        <Badge
          variant={props.userAlreadyVoted ? 'success' : 'info'}
          className='px-2.5 py-1'
        >
          {props.userAlreadyVoted ? <LucideCheck /> : <LucideCircleDot />}
          {props.userAlreadyVoted ? 'En cours · voté' : 'En cours'}
        </Badge>
      );
  }
};

export default VoteBadge;
