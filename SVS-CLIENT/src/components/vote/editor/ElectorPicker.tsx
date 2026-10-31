import apiClient from '@/api/client';
import type { UserResponseModel } from '@/api/sdk';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getUserInitials } from '@/utils/user.utils';
import { LucideSearch } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

/** Search the accounts that can be put on a roll (by name or address) and pick one. Those already chosen are not offered. */
const ElectorPicker = (props: {
  label: string;
  chosen: UserResponseModel[];
  onPick: (user: UserResponseModel) => void;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResponseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const inputId = useId();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setFailed(false);
      return;
    }
    const mine = ++latest.current;
    setLoading(true);
    const timer = setTimeout(() => {
      apiClient()
        .vote.searchElectors(1, 8, query.trim())
        .then((r) => {
          if (mine === latest.current) {
            setResults(r.data.data);
            setFailed(false);
          }
        })
        .catch(() => mine === latest.current && setFailed(true))
        .finally(() => mine === latest.current && setLoading(false));
    }, 250); // not a request per key
    return () => clearTimeout(timer);
  }, [query]);

  const chosen = new Set(props.chosen.map((u) => u.id));
  const offered = results.filter((u) => !chosen.has(u.id));

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={inputId} className='text-sm font-medium'>
        {props.label}
      </label>
      <div className='relative'>
        <LucideSearch className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          id={inputId}
          className='pl-9'
          placeholder='Nom, identifiant ou adresse e-mail (2 lettres au moins)'
          autoComplete='off'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <Spinner className='absolute right-3 top-1/2 -translate-y-1/2' />}
      </div>
      <div aria-live='polite'>
        {failed && <p className='text-sm text-destructive'>La recherche a échoué. Réessayez.</p>}
        {!failed && query.trim().length >= 2 && !loading && offered.length === 0 && (
          <p className='text-sm text-muted-foreground'>Aucun compte à ajouter ne correspond.</p>
        )}
        {offered.length > 0 && (
          <ul className='divide-y rounded-xl border bg-background'>
            {offered.map((user) => (
              <li key={user.id}>
                <button
                  type='button'
                  className='flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent'
                  onClick={() => {
                    props.onPick(user);
                    setResults((r) => r.filter((u) => u.id !== user.id));
                  }}
                >
                  <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground'>
                    {getUserInitials(user)}
                  </span>
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-medium'>
                      {user.first_name} {user.last_name}
                    </span>
                    <span className='block truncate text-xs text-muted-foreground'>{user.email}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ElectorPicker;
