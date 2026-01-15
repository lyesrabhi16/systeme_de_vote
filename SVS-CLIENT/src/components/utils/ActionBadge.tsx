import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { LucideInfo } from 'lucide-react';
import type { ReactNode } from 'react';

const ActionBadge = (props: {
  variant?: 'default' | 'destructive' | 'secondary' | 'outline';
  text: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) => {
  return (
    <Badge
      variant={props.variant}
      className={cn(
        'cursor-pointer px-3 py-1 text-xs shadow-sm ',
        props.className,
        props.disabled && 'pointer-events-none opacity-75',
      )}
      onClick={props.disabled ? undefined : props.onClick}
    >
      {props.loading ? <Spinner /> : props.icon ?? <LucideInfo />}
      {props.text}
    </Badge>
  );
};

export default ActionBadge;
