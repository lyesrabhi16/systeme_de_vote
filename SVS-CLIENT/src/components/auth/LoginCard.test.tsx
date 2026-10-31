// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginFormSchema } from '@/schemas/auth.schemas';

const login = vi.hoisted(() => vi.fn());
vi.mock('@/api/client', () => ({
  default: () => ({}),
  apiClient: () => ({ auth: { login } }),
  ERROR_CODES: {},
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import LoginCard from './LoginCard';

// jsdom has no ResizeObserver, which Radix's checkbox measures itself with
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(cleanup);

describe('the login form', () => {
  it('has no field that changes from uncontrolled to controlled when somebody types', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginCard />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Adresse email'), 'ada@example.org');
    await user.type(screen.getByPlaceholderText('Mot de passe'), 'a password');
    const warnings = errors.mock.calls.map((call) => String(call[0]));
    errors.mockRestore();
    expect(warnings.filter((w) => /uncontrolled|controlled/i.test(w))).toEqual([]);
  });

  it('sends no password for an account that has none yet (it signs in with the code alone), and the password otherwise', async () => {
    login.mockResolvedValue({ data: { id: 'x', masked_email: 'a**@e', first_login: true } });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginCard />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Adresse email'), 'newbie@example.org');
    await user.click(screen.getByRole('button', { name: /Se connecter/ }));
    await vi.waitFor(() => expect(login).toHaveBeenCalledTimes(1));
    expect(login.mock.calls[0][0].password).toBeUndefined(); // not "": an empty password is a password, and the wrong one
  });

  it('accepts an empty password in the schema: the field is optional because first sign-ins have none', () => {
    expect(LoginFormSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(true);
    expect(LoginFormSchema.safeParse({ email: 'not an address', password: '' }).success).toBe(false);
  });
});
