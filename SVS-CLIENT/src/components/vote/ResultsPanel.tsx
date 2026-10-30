import type { FullVoteResponseModel } from '@/api/sdk';
import CandidateAvatar from '@/components/vote/CandidateAvatar';
import { candidateName } from '@/utils/candidate.utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideTrophy } from 'lucide-react';

const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);
const fmt = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

const Stat = (props: { label: string; value: string; hint?: string }) => (
  <div className='rounded-xl bg-muted/60 px-4 py-3'>
    <p className='text-xs uppercase tracking-wide text-muted-foreground'>{props.label}</p>
    <p className='mt-0.5 font-display text-2xl font-semibold'>{props.value}</p>
    {props.hint && <p className='text-xs text-muted-foreground'>{props.hint}</p>}
  </div>
);

/** The result of a counted election: who won, how many votes each, and the turnout. */
const ResultsPanel = (props: { fullVote: FullVoteResponseModel }) => {
  const { fullVote } = props;
  const finished = fullVote.vote;
  const bulletins = fullVote.total_bulletins;
  const ranked = [...fullVote.candidates]
    .map((c) => ({ candidate: c, count: c.vote_count ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const forCandidates = ranked.reduce((sum, r) => sum + r.count, 0);
  const blank = Math.max(0, bulletins - forCandidates);
  const enrolled = finished.voter_count + finished.abstention_count;
  const winners = new Set(finished.winner_candidates ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className='font-display text-2xl font-semibold'>Résultat</h2>
        </CardTitle>
        <CardDescription>
          {winners.size === 0
            ? 'Aucun vote exprimé pour un candidat.'
            : winners.size === 1
              ? 'Un candidat est élu.'
              : 'Égalité : plusieurs candidats sont élus.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-8'>
        <ol className='flex flex-col gap-4'>
          {ranked.map(({ candidate, count }) => {
            const isWinner = candidate.id != null && winners.has(candidate.id);
            return (
              <li key={candidate.id} className='flex items-center gap-4'>
                <CandidateAvatar candidate={candidate} className='size-11' />
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center justify-between gap-x-3'>
                    <p className='flex items-center gap-2 font-medium'>
                      <span className='truncate'>{candidateName(candidate)}</span>
                      {isWinner && (
                        <Badge variant='success'>
                          <LucideTrophy /> Élu
                        </Badge>
                      )}
                    </p>
                    <p className='text-sm tabular-nums'>
                      <strong className='font-semibold'>{count}</strong>{' '}
                      <span className='text-muted-foreground'>
                        voix · {fmt(pct(count, bulletins))}
                      </span>
                    </p>
                  </div>
                  <div
                    className='mt-2 h-2.5 overflow-hidden rounded-full bg-secondary'
                    role='img'
                    aria-label={`${candidateName(candidate)} : ${count} voix sur ${bulletins} bulletins`}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        isWinner ? 'bg-success' : 'bg-primary/60',
                      )}
                      style={{ width: `${pct(count, bulletins)}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
          {blank > 0 && (
            <li className='flex items-center justify-between rounded-xl border border-dashed px-4 py-3 text-sm'>
              <span className='text-muted-foreground'>Bulletins blancs</span>
              <span className='tabular-nums'>
                <strong className='font-semibold'>{blank}</strong>{' '}
                <span className='text-muted-foreground'>· {fmt(pct(blank, bulletins))}</span>
              </span>
            </li>
          )}
        </ol>
        <div className='grid gap-3 sm:grid-cols-3'>
          <Stat label='Bulletins' value={String(bulletins)} hint='comptabilisés' />
          <Stat
            label='Participation'
            value={fmt(pct(finished.voter_count, enrolled))}
            hint={`${finished.voter_count} sur ${enrolled} inscrits`}
          />
          <Stat label='Abstentions' value={String(finished.abstention_count)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;
