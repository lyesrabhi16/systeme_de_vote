// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const checkReceipt = vi.hoisted(() => vi.fn());
vi.mock('@/api/client', () => ({
  default: () => ({ vote: { checkReceipt } }),
  apiClient: () => ({ vote: { checkReceipt } }),
}));

import VerifyPanel from './VerifyPanel';

beforeEach(() => checkReceipt.mockReset());
afterEach(cleanup);

const ask = async (code: string) => {
  const user = userEvent.setup();
  render(<VerifyPanel voteId={7} counted />);
  await user.type(screen.getByLabelText(/Mon bulletin est-il sur le tableau/), code);
  await user.click(screen.getByRole('button', { name: /Vérifier/ }));
};

describe('looking a receipt up on the board', () => {
  it('asks the server about exactly what was typed, for this election', async () => {
    checkReceipt.mockResolvedValue({ data: { result: true } });
    await ask('  abc-DEF_123  ');
    await waitFor(() => expect(checkReceipt).toHaveBeenCalledWith(7, 'abc-DEF_123')); // trimmed, nothing else
    expect(await screen.findByText(/ce bulletin est sur le tableau/)).toBeTruthy();
  });

  it('says so when there is no such receipt', async () => {
    checkReceipt.mockResolvedValue({ data: { result: false } });
    await ask('nope');
    expect(await screen.findByText(/Aucun bulletin ne correspond/)).toBeTruthy();
  });

  it('says the check failed (and not "not found") when the server could not answer', async () => {
    checkReceipt.mockImplementation(() => Promise.resolve().then(() => ({ data: undefined })));
    await ask('whatever');
    expect(await screen.findByText(/vérification a échoué/)).toBeTruthy();
    expect(screen.queryByText(/Aucun bulletin ne correspond/)).toBeNull();
  });

  it('does not ask for nothing', async () => {
    const user = userEvent.setup();
    render(<VerifyPanel voteId={7} counted />);
    expect((screen.getByRole('button', { name: /Vérifier/ }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText(/Mon bulletin est-il sur le tableau/), '   ');
    expect((screen.getByRole('button', { name: /Vérifier/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(checkReceipt).not.toHaveBeenCalled();
  });
});
