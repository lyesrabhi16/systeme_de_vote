import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CopyButton from '@/components/vote/CopyButton';
import { LucideCircleAlert, LucideCircleCheck, LucideScanSearch, LucideSearch } from 'lucide-react';
import { useState } from 'react';

type Status = 'idle' | 'checking' | 'found' | 'missing' | 'error';

/** Individual and universal verification: is my receipt on the board, and how can anybody redo the count. */
const VerifyPanel = (props: { voteId: number; counted: boolean }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const check = async () => {
    const wanted = code.trim();
    if (!wanted) return;
    setStatus('checking');
    try {
      const { data } = await apiClient().bulletins.getAllBulletins(1, 10, wanted, props.voteId);
      // the search matches parts of a code: the receipt is the one that is equal
      setStatus(data.data.some((b) => (b as { unique_code?: string }).unique_code === wanted) ? 'found' : 'missing');
    } catch {
      setStatus('error');
    }
  };

  const command = `python -m app.utils.audit ${window.location.origin} ${props.voteId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className='flex items-center gap-2 font-display text-2xl font-semibold'>
            <LucideScanSearch className='size-6 text-primary' /> Vérifier
          </h2>
        </CardTitle>
        <CardDescription>
          Le tableau d'affichage est public : les bulletins chiffrés y sont, sans nom.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-6'>
        <form
          className='flex flex-col gap-2'
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
        >
          <label htmlFor='receipt' className='text-sm font-medium'>
            Mon bulletin est-il sur le tableau ?
          </label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input
              id='receipt'
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setStatus('idle');
              }}
              placeholder='Collez votre reçu'
              autoComplete='off'
              spellCheck={false}
              className='font-mono'
            />
            <Button type='submit' disabled={!code.trim() || status === 'checking'}>
              <LucideSearch /> Vérifier
            </Button>
          </div>
          <div aria-live='polite' className='min-h-6 text-sm'>
            {status === 'found' && (
              <p className='flex items-center gap-2 text-success'>
                <LucideCircleCheck className='size-4' /> Oui : ce bulletin est sur le tableau d'affichage.
              </p>
            )}
            {status === 'missing' && (
              <p className='flex items-center gap-2 text-destructive'>
                <LucideCircleAlert className='size-4' /> Aucun bulletin ne correspond à ce reçu pour cette élection.
              </p>
            )}
            {status === 'error' && (
              <p className='flex items-center gap-2 text-destructive'>
                <LucideCircleAlert className='size-4' /> La vérification a échoué. Réessayez.
              </p>
            )}
          </div>
        </form>

        <div className='flex flex-col gap-2'>
          <p className='text-sm font-medium'>Refaire le décompte soi-même</p>
          {props.counted ? (
            <>
              <p className='text-sm text-muted-foreground'>
                Ce programme lit le tableau, vérifie chaque preuve, refait les sommes et contrôle que le résultat publié en est le
                déchiffrement. Il ne demande aucun secret.
              </p>
              <div className='flex items-center gap-2 rounded-xl bg-muted p-3'>
                <code className='flex-1 select-all overflow-x-auto whitespace-nowrap font-mono text-xs'>{command}</code>
                <CopyButton text={command} />
              </div>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Disponible dès que le décompte est publié.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerifyPanel;
