import type { Candidate } from '@/api/sdk';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LucideUserCircle } from 'lucide-react';

const CandidateCard = (props: {
  candidate: Candidate;
  isWinner?: boolean;
  selected?: boolean;
  disabled?: boolean;
  isVoteFinished?: boolean;
  onClick?: () => void;
}) => {
  const { candidate, isWinner, selected: _selected, disabled, onClick } = props;
  const color = isWinner ? 'border-green-500' : 'border-primary';
  const selected = (_selected && !disabled) || isWinner;
  return (
    <Card
      key={candidate.id}
      onClick={onClick}
      className={
        selected
          ? `w-64 flex flex-col flex-nowrap gap-2 justify-center items-center ${
              disabled ? '' : 'scale-110 cursor-pointer'
            } transition-transform duration-200 border-2 ${color} px-0`
          : `w-64 flex flex-col flex-nowrap gap-2 justify-center items-center ${
              disabled ? '' : 'hover:scale-110 cursor-pointer'
            } transition-transform duration-200 `
      }
    >
      <CardContent className='flex flex-col items-center'>
        {candidate.photo_url !== '' ? (
          <LucideUserCircle size={64} />
        ) : (
          <img
            src={candidate.photo_url}
            alt={`${candidate.first_name} ${candidate.last_name}`}
            className='w-16 h-16 mb-2 rounded-full'
          />
        )}
        <h2 className='text-lg font-semibold'>
          {candidate.first_name} {candidate.last_name}{' '}
        </h2>
        {isWinner && (
          <Badge className='bg-green-500 text-white w-16 text-center py-1 m-0'>
            Élu
          </Badge>
        )}
        {props.isVoteFinished && (
          <p className='text-sm text-muted-foreground mt-2'>
            Votes: {candidate.vote_count ?? 0}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
