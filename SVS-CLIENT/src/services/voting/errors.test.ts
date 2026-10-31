import { describe, expect, it } from 'vitest';
import { interpretCastError } from './errors';

const refused = (code: string) => ({ response: { data: { detail: { code } } } });

describe('what a refused ballot means', () => {
  it('already voted: say so, and do not offer another try', () => {
    expect(interpretCastError(refused('ALREADY_VOTED'))).toMatchObject({ alreadyVoted: true, final: true, closed: false });
  });
  it('election over: the page closes the ballot', () => {
    expect(interpretCastError(refused('VOTE_FINISHED'))).toMatchObject({ closed: true, final: true });
  });
  it('not open yet, or not on the roll: no other try either', () => {
    expect(interpretCastError(refused('VOTE_NOT_STARTED')).final).toBe(true);
    expect(interpretCastError(refused('NOT_ELIGIBLE')).final).toBe(true);
  });
  it('a ballot that did not validate may be tried again (the voter reloads)', () => {
    const failure = interpretCastError(refused('INVALID_BALLOT'));
    expect(failure.final).toBe(false);
    expect(failure.message).toMatch(/validé/);
  });
  it('anything else (a network error, a 500) is a generic message and another try', () => {
    for (const err of [new Error('Network Error'), refused('INTERNAL_SERVER_ERROR'), undefined]) {
      expect(interpretCastError(err)).toMatchObject({ final: false, alreadyVoted: false, closed: false });
    }
  });
});
