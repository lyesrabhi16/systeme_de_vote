import type { PropsWithChildren, ReactNode } from 'react';

/** A titled block of the home page, with an optional hint on the right. */
const Section = (props: PropsWithChildren<{ title: string; hint?: ReactNode; id?: string }>) => (
  <section className='flex w-full flex-col gap-4' aria-labelledby={props.id}>
    <div className='flex flex-wrap items-baseline justify-between gap-2'>
      <h2 id={props.id} className='text-2xl font-semibold'>
        {props.title}
      </h2>
      {props.hint && <p className='text-sm text-muted-foreground'>{props.hint}</p>}
    </div>
    {props.children}
  </section>
);

export const EmptyState = (props: { icon: ReactNode; title: string; children?: ReactNode }) => (
  <div className='flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center'>
    <div className='flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5'>
      {props.icon}
    </div>
    <p className='font-medium'>{props.title}</p>
    {props.children && <p className='max-w-md text-sm text-muted-foreground'>{props.children}</p>}
  </div>
);

export default Section;
