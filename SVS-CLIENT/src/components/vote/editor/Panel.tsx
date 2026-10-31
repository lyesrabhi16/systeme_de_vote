import type { PropsWithChildren, ReactNode } from 'react';

/** A section of the editor: a title, what it is for, and its content. */
const Panel = (props: PropsWithChildren<{ title: string; description?: ReactNode; action?: ReactNode; id?: string }>) => (
  <section aria-labelledby={props.id} className='rounded-2xl border bg-card p-5 shadow-xs sm:p-6'>
    <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
      <div>
        <h2 id={props.id} className='text-xl font-semibold'>
          {props.title}
        </h2>
        {props.description && <p className='mt-1 text-sm text-muted-foreground'>{props.description}</p>}
      </div>
      {props.action}
    </div>
    {props.children}
  </section>
);

export default Panel;
