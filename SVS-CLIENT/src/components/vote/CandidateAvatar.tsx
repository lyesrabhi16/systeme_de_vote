import type { Candidate } from '@/api/sdk';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const initials = (c: Pick<Candidate, 'first_name' | 'last_name'>) =>
  `${c.first_name.charAt(0)}${c.last_name.charAt(0)}`.toUpperCase();

const CandidateAvatar = (props: { candidate: Candidate; className?: string }) => (
  <Avatar className={cn('size-12', props.className)}>
    {props.candidate.photo_url && <AvatarImage src={props.candidate.photo_url} alt='' />}
    <AvatarFallback className='bg-accent text-base font-semibold text-accent-foreground'>
      {initials(props.candidate)}
    </AvatarFallback>
  </Avatar>
);

export default CandidateAvatar;
