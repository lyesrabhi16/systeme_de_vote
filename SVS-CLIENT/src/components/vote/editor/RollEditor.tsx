import apiClient from '@/api/client';
import type { UserResponseModel } from '@/api/sdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ElectorPicker from '@/components/vote/editor/ElectorPicker';
import { cn } from '@/lib/utils';
import type { RollChoice } from '@/components/vote/editor/roll';
import { getUserInitials } from '@/utils/user.utils';
import { LucideChevronLeft, LucideChevronRight, LucideUsers, LucideX } from 'lucide-react';
import { useEffect, useState } from 'react';

const PersonRow = (props: { user: UserResponseModel; onRemove?: () => void }) => (
  <li className='flex items-center gap-3 px-3 py-2'>
    <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground'>
      {getUserInitials(props.user)}
    </span>
    <span className='min-w-0 flex-1'>
      <span className='block truncate text-sm font-medium'>
        {props.user.first_name} {props.user.last_name}
        {props.user.is_admin && (
          <Badge variant='muted' className='ml-2 align-middle'>
            admin
          </Badge>
        )}
      </span>
      <span className='block truncate text-xs text-muted-foreground'>{props.user.email}</span>
    </span>
    {props.onRemove && (
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        onClick={props.onRemove}
        aria-label={`Retirer ${props.user.first_name} ${props.user.last_name}`}
      >
        <LucideX />
      </Button>
    )}
  </li>
);

/** Choose a roll: everybody except some people, or just some people. */
export const RollChooser = (props: { value: RollChoice; onChange: (roll: RollChoice) => void }) => {
  const { value, onChange } = props;
  const modes: { mode: RollChoice['mode']; title: string; text: string }[] = [
    { mode: 'all', title: 'Tous les comptes', text: 'Tous les comptes actifs à ce jour (ceux créés ensuite ne sont pas ajoutés).' },
    { mode: 'some', title: 'Des électeurs choisis', text: 'Seules les personnes que vous ajoutez peuvent voter.' },
  ];
  return (
    <div className='flex flex-col gap-5'>
      <fieldset className='grid gap-3 sm:grid-cols-2'>
        <legend className='sr-only'>Qui peut voter</legend>
        {modes.map((m) => (
          <label key={m.mode} className='relative block cursor-pointer'>
            <input
              type='radio'
              name='roll-mode'
              className='peer sr-only'
              checked={value.mode === m.mode}
              onChange={() => onChange({ ...value, mode: m.mode })}
            />
            <div
              className={cn(
                'h-full rounded-xl border bg-background p-4 transition-[border-color,box-shadow]',
                'peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
              )}
            >
              <p className='font-medium'>{m.title}</p>
              <p className='mt-1 text-sm text-muted-foreground'>{m.text}</p>
            </div>
          </label>
        ))}
      </fieldset>

      {value.mode === 'all' ? (
        <div className='flex flex-col gap-3'>
          <ElectorPicker
            label='Exclure des comptes (facultatif)'
            chosen={value.excluded}
            onPick={(u) => onChange({ ...value, excluded: [...value.excluded, u] })}
          />
          {value.excluded.length > 0 && (
            <div>
              <p className='mb-1 text-sm font-medium'>Exclus ({value.excluded.length})</p>
              <ul className='divide-y rounded-xl border bg-background'>
                {value.excluded.map((u) => (
                  <PersonRow key={u.id} user={u} onRemove={() => onChange({ ...value, excluded: value.excluded.filter((x) => x.id !== u.id) })} />
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <ElectorPicker
            label='Ajouter des électeurs'
            chosen={value.included}
            onPick={(u) => onChange({ ...value, included: [...value.included, u] })}
          />
          <div>
            <p className='mb-1 text-sm font-medium'>Électeurs ({value.included.length})</p>
            {value.included.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground'>
                Personne pour le moment.
              </p>
            ) : (
              <ul className='divide-y rounded-xl border bg-background'>
                {value.included.map((u) => (
                  <PersonRow key={u.id} user={u} onRemove={() => onChange({ ...value, included: value.included.filter((x) => x.id !== u.id) })} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PAGE = 8;

/** The roll of an election as it is now: who can vote, a page at a time, searchable. Read only. */
export const CurrentRoll = (props: { voteId: number }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<{ users: UserResponseModel[]; total: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    const timer = setTimeout(
      () => {
        apiClient()
          .vote.getVoteRoll(props.voteId, page, PAGE, search.trim() || undefined)
          .then((r) => current && (setState({ users: r.data.data, total: r.data.total_count }), setFailed(false)))
          .catch(() => current && setFailed(true));
      },
      search ? 250 : 0,
    );
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [props.voteId, page, search]);

  const pages = state ? Math.max(1, Math.ceil(state.total / PAGE)) : 1;
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='flex items-center gap-2 text-sm'>
          <LucideUsers className='size-4 text-muted-foreground' />
          {state ? (
            <span>
              <strong className='font-semibold'>{state.total}</strong> inscrit{state.total > 1 ? 's' : ''}
              {search.trim() ? ' pour cette recherche' : ''}
            </span>
          ) : (
            'Chargement…'
          )}
        </p>
        <Input
          className='max-w-64'
          placeholder='Rechercher dans la liste'
          aria-label='Rechercher dans la liste électorale'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {failed && <p className='text-sm text-destructive'>La liste n'a pas pu être chargée.</p>}
      {!state && !failed && <Skeleton className='h-32 rounded-xl' />}
      {state && (
        <ul className='divide-y rounded-xl border bg-background'>
          {state.users.length === 0 ? (
            <li className='px-4 py-6 text-center text-sm text-muted-foreground'>Personne ne correspond.</li>
          ) : (
            state.users.map((u) => <PersonRow key={u.id} user={u} />)
          )}
        </ul>
      )}
      {pages > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <span className='text-xs text-muted-foreground'>
            Page {page} sur {pages}
          </span>
          <Button type='button' variant='outline' size='icon-sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label='Page précédente'>
            <LucideChevronLeft />
          </Button>
          <Button type='button' variant='outline' size='icon-sm' disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label='Page suivante'>
            <LucideChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
};
