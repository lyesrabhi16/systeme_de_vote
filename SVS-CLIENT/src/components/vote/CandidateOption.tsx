import type { Candidate } from '@/api/sdk';
import CandidateAvatar from '@/components/vote/CandidateAvatar';
import { cn } from '@/lib/utils';
import { LucideCheck } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * One choice of a ballot, as a radio button (native: the keyboard, the arrows and the screen readers work as they do everywhere)
 * dressed as a card. `children` is what is shown instead of a candidate (the blank ballot).
 */
const CandidateOption = (props: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  label: string;
  candidate?: Candidate;
  children?: ReactNode;
}) => (
  <label
    className={cn(
      'relative block cursor-pointer',
      props.disabled && 'cursor-not-allowed opacity-70',
    )}
  >
    <input
      type='radio'
      className='peer sr-only'
      name={props.name}
      value={props.value}
      checked={props.checked}
      disabled={props.disabled}
      onChange={props.onSelect}
    />
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow,background-color]',
        'hover:border-primary/40 hover:shadow-sm',
        'peer-checked:border-primary peer-checked:bg-accent/40 peer-checked:shadow-md peer-checked:ring-1 peer-checked:ring-primary',
        'peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
        props.disabled && 'hover:border-border hover:shadow-xs',
      )}
    >
      {props.candidate ? (
        <CandidateAvatar candidate={props.candidate} />
      ) : (
        props.children
      )}
      <span className='flex-1 font-medium'>{props.label}</span>
      <span
        aria-hidden
        className={cn(
          'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
          props.checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input text-transparent',
        )}
      >
        <LucideCheck className='size-3.5' strokeWidth={3} />
      </span>
    </div>
  </label>
);

export default CandidateOption;
