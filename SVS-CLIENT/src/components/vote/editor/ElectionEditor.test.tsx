// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FullVoteResponseModel } from '@/api/sdk';

const api = vi.hoisted(() => ({
  createVote: vi.fn(),
  updateVote: vi.fn(),
  deleteVote: vi.fn(),
  getVoteRoll: vi.fn(),
  searchElectors: vi.fn(),
}));
vi.mock('@/api/client', () => ({
  default: () => ({ vote: api }),
  apiClient: () => ({ vote: api }),
  ERROR_CODES: {},
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from 'sonner';
import ElectionEditor from './ElectionEditor';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const day = 24 * 3600 * 1000;
const user = (id: number, first: string, last: string) => ({
  id,
  first_name: first,
  last_name: last,
  email: `${first.toLowerCase()}@example.org`,
  username: first.toLowerCase(),
  phone_number: '1',
  is_active: true,
  is_admin: false,
});

const election = (): FullVoteResponseModel => {
  const candidates = [
    { id: 1, first_name: 'Camille', last_name: 'Roux', vote_id: 7, photo_url: null, vote_count: 0 },
    { id: 2, first_name: 'Jules', last_name: 'Fabre', vote_id: 7, photo_url: null, vote_count: 0 },
  ];
  return {
    total_bulletins: 0,
    candidates,
    vote: {
      total_bulletins: 0,
      candidates,
      candidate_results: {},
      abstention_count: 0,
      voter_count: 0,
      user_has_voted: false,
      winner_candidates: [],
      vote: {
        id: 7,
        title: 'Délégué',
        description: 'Un seul choix',
        start_date: new Date(Date.now() + 2 * day).toISOString(),
        end_date: new Date(Date.now() + 4 * day).toISOString(),
        has_been_counted: false,
        public_key: '{}',
        creator: { id: 1, first_name: 'O', last_name: 'S', username: 'organizer' },
      },
    },
  };
};

const Where = () => <p data-testid='where'>{useLocation().pathname}</p>;
const show = (fullVote?: FullVoteResponseModel) =>
  render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route path='/editor' element={<ElectionEditor fullVote={fullVote} />} />
        <Route path='*' element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  vi.mocked(toast.error).mockReset();
  api.getVoteRoll.mockResolvedValue({ data: { data: [user(1, 'Ada', 'Lovelace')], total_count: 1 } });
});
afterEach(cleanup);

const fillCreation = async (u: ReturnType<typeof userEvent.setup>) => {
  await u.type(screen.getByLabelText('Titre'), '  Budget  ');
  await u.type(screen.getByLabelText('Description'), 'Où va l’argent');
  const first = screen.getAllByLabelText('Prénom');
  const last = screen.getAllByLabelText('Nom');
  await u.type(first[0], 'Ada');
  await u.type(last[0], 'Lovelace');
  await u.type(first[1], 'Alan');
  await u.type(last[1], 'Turing');
};

describe('making an election', () => {
  it('starts with two empty candidates and refuses to be saved empty, without calling the server', async () => {
    const u = userEvent.setup();
    show();
    expect(screen.getAllByLabelText('Prénom')).toHaveLength(2);
    await u.click(screen.getByRole('button', { name: /Créer l'élection/ }));
    expect(await screen.findByText('Le titre est requis')).toBeTruthy();
    expect(screen.getAllByText('Le prénom est requis').length).toBe(2);
    expect(api.createVote).not.toHaveBeenCalled();
  });

  it('sends the election as filled in (dates as moments, names trimmed), open to all, and goes to its page: no second click makes a second one', async () => {
    api.createVote.mockResolvedValue({ data: { vote: { vote: { id: 42 } } } });
    const u = userEvent.setup();
    show();
    await fillCreation(u);
    await u.click(screen.getByRole('button', { name: /Créer l'élection/ }));
    await waitFor(() => expect(api.createVote).toHaveBeenCalledTimes(1));
    const body = api.createVote.mock.calls[0][0];
    expect(body).toMatchObject({
      title: 'Budget',
      description: 'Où va l’argent',
      open_to_all: true,
      attributed_user_ids: [],
      excluded_user_ids: [],
    });
    expect(body.candidates).toEqual([
      { first_name: 'Ada', last_name: 'Lovelace', photo_url: null },
      { first_name: 'Alan', last_name: 'Turing', photo_url: null },
    ]);
    expect(new Date(body.start_date).toISOString()).toBe(body.start_date); // a moment, not a wall clock
    expect(new Date(body.end_date) > new Date(body.start_date)).toBe(true);
    expect((await screen.findByTestId('where')).textContent).toBe('/admin/vote/42');
  });

  it('can add and remove candidates', async () => {
    const u = userEvent.setup();
    show();
    await u.click(screen.getByRole('button', { name: /Ajouter un candidat/ }));
    expect(screen.getAllByLabelText('Prénom')).toHaveLength(3);
    await u.click(screen.getByRole('button', { name: 'Retirer le candidat 3' }));
    expect(screen.getAllByLabelText('Prénom')).toHaveLength(2);
  });

  it('sends the chosen electors, and refuses a roll of nobody', async () => {
    api.createVote.mockResolvedValue({ data: { vote: { vote: { id: 5 } } } });
    api.searchElectors.mockResolvedValue({ data: { data: [user(11, 'Grace', 'Hopper')], total_count: 1 } });
    const u = userEvent.setup();
    show();
    await fillCreation(u);
    await u.click(screen.getByRole('radio', { name: /Des électeurs choisis/ }));
    await u.click(screen.getByRole('button', { name: /Créer l'élection/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/au moins un électeur/), expect.anything()));
    expect(api.createVote).not.toHaveBeenCalled();

    await u.type(screen.getByLabelText('Ajouter des électeurs'), 'gra');
    await u.click(await screen.findByRole('button', { name: /Grace Hopper/ }));
    expect(screen.getByText('Électeurs (1)')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: /Créer l'élection/ }));
    await waitFor(() => expect(api.createVote).toHaveBeenCalledTimes(1));
    expect(api.createVote.mock.calls[0][0]).toMatchObject({ open_to_all: false, attributed_user_ids: [11], excluded_user_ids: [] });
  });
});

describe('changing an election that has not opened', () => {
  it('shows who is on the roll, and a new title is saved WITHOUT touching it', async () => {
    api.updateVote.mockResolvedValue({ data: { ...election(), vote: { ...election().vote, vote: { ...election().vote.vote, title: 'Renamed' } } } });
    const u = userEvent.setup();
    show(election());
    expect(await screen.findByText(/inscrit/)).toBeTruthy();
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    const title = screen.getByLabelText('Titre') as HTMLInputElement;
    expect(title.value).toBe('Délégué'); // what is saved, not blanks
    await u.clear(title);
    await u.type(title, 'Renamed');
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(api.updateVote).toHaveBeenCalledTimes(1));
    const [id, body] = api.updateVote.mock.calls[0];
    expect(id).toBe(7);
    expect(body.title).toBe('Renamed');
    // The old editor sent "open to all" with every save: renaming an election enrolled every account in it.
    expect(body).not.toHaveProperty('open_to_all');
    expect(body).not.toHaveProperty('attributed_user_ids');
    expect(body).not.toHaveProperty('excluded_user_ids');
  });

  it('has nothing to save until something changes', () => {
    show(election());
    expect((screen.getByRole('button', { name: 'Enregistrer' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Tout est enregistré')).toBeTruthy();
  });

  it('replaces the roll only when asked, and says that it replaces', async () => {
    api.updateVote.mockResolvedValue({ data: election() });
    api.searchElectors.mockResolvedValue({ data: { data: [user(11, 'Grace', 'Hopper')], total_count: 1 } });
    const u = userEvent.setup();
    show(election());
    await u.click(screen.getByRole('button', { name: 'Remplacer la liste' }));
    expect(screen.getByText(/remplace/)).toBeTruthy();
    await u.click(screen.getByRole('radio', { name: /Des électeurs choisis/ }));
    await u.type(screen.getByLabelText('Ajouter des électeurs'), 'gra');
    await u.click(await screen.findByRole('button', { name: /Grace Hopper/ }));
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(api.updateVote).toHaveBeenCalledTimes(1));
    expect(api.updateVote.mock.calls[0][1]).toMatchObject({ open_to_all: false, attributed_user_ids: [11], excluded_user_ids: [] });
  });

  it('keeps the current roll when the replacement is given up', async () => {
    const u = userEvent.setup();
    show(election());
    await u.click(screen.getByRole('button', { name: 'Remplacer la liste' }));
    await u.click(screen.getByRole('button', { name: 'Garder la liste actuelle' }));
    expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  });

  it('says so when the server refuses because the election has opened meanwhile', async () => {
    api.updateVote.mockRejectedValue({ response: { data: { detail: { code: 'VOTE_STARTED_CANNOT_UPDATE' } } } });
    const u = userEvent.setup();
    show(election());
    const title = screen.getByLabelText('Titre');
    await u.type(title, '!');
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/ne peut plus être modifiée/), expect.anything()));
  });

  it('deletes after a confirmation, and goes back to the list', async () => {
    api.deleteVote.mockResolvedValue({});
    const u = userEvent.setup();
    show(election());
    await u.click(screen.getByRole('button', { name: /Supprimer/ }));
    const dialog = await screen.findByRole('dialog');
    expect(api.deleteVote).not.toHaveBeenCalled();
    await u.click(within(dialog).getByRole('button', { name: /Supprimer/ }));
    await waitFor(() => expect(api.deleteVote).toHaveBeenCalledWith(7));
    expect((await screen.findByTestId('where')).textContent).toBe('/admin/votes');
  });
});

describe('the period', () => {
  it('refuses an end before the start', async () => {
    const u = userEvent.setup();
    show();
    await fillCreation(u);
    fireEvent.change(screen.getByLabelText('Clôture'), { target: { value: '2000-01-01T10:00' } });
    await u.click(screen.getByRole('button', { name: /Créer l'élection/ }));
    expect(await screen.findByText("La clôture doit être après l'ouverture")).toBeTruthy();
    expect(api.createVote).not.toHaveBeenCalled();
  });
});
