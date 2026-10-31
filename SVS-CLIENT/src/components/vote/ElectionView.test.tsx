// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FullVoteResponseModel } from '@/api/sdk';

const cast = vi.hoisted(() => vi.fn());
vi.mock('@/services/voting/voting', () => ({ castVote: cast }));
vi.mock('@/api/client', () => ({
  default: () => ({ bulletins: { getAllBulletins: vi.fn() } }),
  apiClient: () => ({ bulletins: { getAllBulletins: vi.fn() } }),
  ERROR_CODES: {
    ALREADY_VOTED: 'ALREADY_VOTED',
    VOTE_FINISHED: 'VOTE_FINISHED',
    VOTE_NOT_STARTED: 'VOTE_NOT_STARTED',
    NOT_ELIGIBLE: 'NOT_ELIGIBLE',
    INVALID_BALLOT: 'INVALID_BALLOT',
  },
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import ElectionView from './ElectionView';

const day = 24 * 3600 * 1000;
const iso = (offset: number) => new Date(Date.now() + offset * day).toISOString();

const election = (over: Partial<{ start: number; end: number; counted: boolean; voted: boolean }> = {}): FullVoteResponseModel => {
  const { start = -1, end = 2, counted = false, voted = false } = over;
  const candidates = [
    { id: 1, first_name: 'Camille', last_name: 'Roux', vote_id: 7, vote_count: counted ? 3 : 0 },
    { id: 2, first_name: 'Jules', last_name: 'Fabre', vote_id: 7, vote_count: counted ? 1 : 0 },
  ];
  return {
    total_bulletins: counted ? 5 : 0,
    candidates,
    vote: {
      total_bulletins: counted ? 5 : 0,
      candidates,
      candidate_results: counted ? { 1: 3, 2: 1 } : {},
      abstention_count: counted ? 2 : 0,
      voter_count: counted ? 5 : 0,
      user_has_voted: voted,
      winner_candidates: counted ? [1] : [],
      vote: {
        id: 7,
        title: 'Délégué',
        description: 'Un seul choix',
        start_date: iso(start),
        end_date: iso(end),
        has_been_counted: counted,
        public_key: '{"n":"1","g":"2"}',
        creator: { id: 1, first_name: 'Olivier', last_name: 'S', username: 'organizer' },
      },
    },
  };
};

const show = (fullVote: FullVoteResponseModel) =>
  render(
    <MemoryRouter>
      <ElectionView fullVote={fullVote} />
    </MemoryRouter>,
  );

beforeEach(() => cast.mockReset());
afterEach(cleanup);

describe('an open election', () => {
  it('offers the candidates and the blank ballot, and the vote waits for a choice', () => {
    show(election());
    expect(screen.getByRole('radio', { name: /Camille Roux/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Vote blanc/ })).toBeTruthy();
    expect((screen.getByRole('button', { name: /Voter/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('asks to confirm, and sends the chosen candidate', async () => {
    cast.mockResolvedValue({ data: { unique_code: 'RECEIPT-CODE' } });
    const user = userEvent.setup();
    show(election());
    await user.click(screen.getByRole('radio', { name: /Jules Fabre/ }));
    await user.click(screen.getByRole('button', { name: /Voter/ }));
    expect(cast).not.toHaveBeenCalled(); // nothing is sent before the confirmation
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Jules Fabre/)).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: /Confirmer/ }));
    await waitFor(() => expect(cast).toHaveBeenCalledTimes(1));
    expect(cast.mock.calls[0][2]).toBe(2);
    expect(await screen.findByText('RECEIPT-CODE')).toBeTruthy(); // the receipt is shown
  });

  it('sends null for the blank ballot', async () => {
    cast.mockResolvedValue({ data: { unique_code: 'R' } });
    const user = userEvent.setup();
    show(election());
    await user.click(screen.getByRole('radio', { name: /Vote blanc/ }));
    await user.click(screen.getByRole('button', { name: /Voter/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Confirmer/ }));
    await waitFor(() => expect(cast).toHaveBeenCalled());
    expect(cast.mock.calls[0][2]).toBeNull();
  });

  it('can be changed before the confirmation', async () => {
    const user = userEvent.setup();
    show(election());
    await user.click(screen.getByRole('radio', { name: /Camille Roux/ }));
    await user.click(screen.getByRole('button', { name: /Voter/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Modifier/ }));
    expect(cast).not.toHaveBeenCalled();
    expect((screen.getByRole('radio', { name: /Camille Roux/ }) as HTMLInputElement).checked).toBe(true);
  });

});

describe('the other states', () => {
  it('shows a voter who has voted that they have, with no way to vote again', () => {
    show(election({ voted: true }));
    expect(screen.getByText(/Vous avez voté/)).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Voter$/ })).toBeNull();
    expect(screen.getByLabelText(/Mon bulletin est-il sur le tableau/)).toBeTruthy(); // and can find the ballot
  });

  it('lists the candidates of an election that has not opened, without a ballot', () => {
    show(election({ start: 2, end: 5 }));
    expect(screen.getByText(/ouvre dans/i)).toBeTruthy();
    expect(screen.getByText('Camille Roux')).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('says the count is under way when it is over and not counted', () => {
    show(election({ start: -5, end: -1 }));
    expect(screen.getByText(/décompte est en cours/)).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('shows the result of a counted election: the winner, the shares, the blank ballots and the turnout', () => {
    show(election({ start: -5, end: -1, counted: true, voted: true }));
    expect(screen.getByRole('heading', { name: 'Résultat' })).toBeTruthy();
    expect(screen.getByText('Élu')).toBeTruthy();
    expect(screen.getByText(/60 %/)).toBeTruthy(); // 3 of 5 bulletins
    expect(screen.getByText('Bulletins blancs')).toBeTruthy(); // 5 - 3 - 1
    expect(screen.getByText(/python -m app\.utils\.audit/)).toBeTruthy(); // and how to check it
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
