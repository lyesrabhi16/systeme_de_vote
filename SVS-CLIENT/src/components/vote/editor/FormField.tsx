import { cn } from '@/lib/utils';
import type { PropsWithChildren, ReactNode } from 'react';

/** A label above a control, a hint under it, and the error of the field (read out when it appears). */
const FormField = (
  props: PropsWithChildren<{ id: string; label: string; hint?: ReactNode; error?: string; className?: string }>,
) => (
  <div className={cn('flex flex-col gap-1.5', props.className)}>
    <label htmlFor={props.id} className='text-sm font-medium'>
      {props.label}
    </label>
    {props.children}
    {props.hint && !props.error && <p className='text-xs text-muted-foreground'>{props.hint}</p>}
    <p role='alert' className='min-h-0 text-xs text-destructive empty:hidden'>
      {props.error}
    </p>
  </div>
);

export default FormField;
