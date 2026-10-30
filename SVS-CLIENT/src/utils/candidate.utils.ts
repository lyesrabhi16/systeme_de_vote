import type { Candidate } from '@/api/sdk';

export const candidateName = (c: Pick<Candidate, 'first_name' | 'last_name'>) => `${c.first_name} ${c.last_name}`;
