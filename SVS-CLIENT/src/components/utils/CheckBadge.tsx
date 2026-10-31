import ActionBadge from '@/components/utils/ActionBadge';
import { cn } from '@/lib/utils';
import { LucideCheck, LucideX } from 'lucide-react';
import React from 'react';

type OptionalActionProps = Omit<
  React.ComponentProps<typeof ActionBadge>,
  'text'
> & {
  text?: React.ComponentProps<typeof ActionBadge>['text'];
};

const CheckBadge = (
  props: {
    test: () => boolean;
    successText: string;
    failText: string;
  } & OptionalActionProps,
) => {
  const testPassed = props.test();
  return (
    <ActionBadge
      {...props}
      className={cn(
        testPassed ? 'bg-green-500' : 'bg-destructive',
        props.className,
      )}
      icon={testPassed ? <LucideCheck /> : <LucideX />}
      text={testPassed ? props.successText : props.failText}
    />
  );
};

export default CheckBadge;
