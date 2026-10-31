import { describe, expect, it } from 'vitest';
import { toInputValue } from '@/utils/dates';
import { ElectionFormSchema } from './vote.schemas';

const day = 24 * 3600 * 1000;
const at = (days: number) => toInputValue(new Date(Date.now() + days * day));
const valid = {
  title: 'Délégué',
  description: 'Un seul choix',
  start: at(1),
  end: at(3),
  candidates: [
    { first_name: 'Camille', last_name: 'Roux', photo_url: '' },
    { first_name: 'Jules', last_name: 'Fabre', photo_url: '' },
  ],
};
const messages = (input: unknown) => {
  const r = ElectionFormSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('the election form', () => {
  it('accepts a complete election', () => {
    expect(messages(valid)).toEqual([]);
  });
  it('needs a title, a description and two candidates', () => {
    expect(messages({ ...valid, title: '  ' })).toEqual(['title: Le titre est requis']);
    expect(messages({ ...valid, description: '' })).toEqual(['description: La description est requise']);
    expect(messages({ ...valid, candidates: valid.candidates.slice(0, 1) })).toEqual(['candidates: Au moins 2 candidats sont requis']);
  });
  it('needs both dates, the end after the start and in the future', () => {
    expect(messages({ ...valid, start: '' })[0]).toMatch(/^start:/);
    expect(messages({ ...valid, end: at(0.5) })).toEqual(["end: La clôture doit être après l'ouverture"]);
    expect(messages({ ...valid, start: at(-5), end: at(-2) })).toEqual(['end: La clôture ne peut pas être dans le passé']);
  });
  it('lets an election open now or already (it is the server that says when it can still be edited)', () => {
    expect(messages({ ...valid, start: at(-0.01) })).toEqual([]);
  });
  it('refuses a candidate with no name, and the same candidate twice', () => {
    const empty = { ...valid, candidates: [...valid.candidates, { first_name: '', last_name: 'X', photo_url: '' }] };
    expect(messages(empty)).toEqual(['candidates.2.first_name: Le prénom est requis']);
    const twice = { ...valid, candidates: [...valid.candidates, { first_name: ' camille ', last_name: 'ROUX', photo_url: '' }] };
    expect(messages(twice)).toEqual(['candidates.2.last_name: Ce candidat est déjà dans la liste']);
  });
  it('takes a photo address that is a web address, or nothing', () => {
    const photo = (photo_url: string) => ({ ...valid, candidates: [{ ...valid.candidates[0], photo_url }, valid.candidates[1]] });
    expect(messages(photo('https://example.org/a.png'))).toEqual([]);
    expect(messages(photo('javascript:alert(1)'))[0]).toMatch(/http/);
  });
});
