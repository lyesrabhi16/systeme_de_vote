import type { UserResponseModel } from '@/api/sdk';

/** Who may vote, as it is chosen: everybody (minus some), or some. */
export type RollChoice = {
  mode: 'all' | 'some';
  included: UserResponseModel[];
  excluded: UserResponseModel[];
};

export const EMPTY_ROLL: RollChoice = { mode: 'all', included: [], excluded: [] };

/** What the API takes for a roll that is chosen. */
export const rollToRequest = (roll: RollChoice) => ({
  open_to_all: roll.mode === 'all',
  attributed_user_ids: roll.mode === 'some' ? roll.included.map((u) => u.id) : [],
  excluded_user_ids: roll.mode === 'all' ? roll.excluded.map((u) => u.id) : [],
});

/** Why a roll cannot be used, or null. */
export const rollProblem = (roll: RollChoice): string | null =>
  roll.mode === 'some' && roll.included.length === 0 ? 'Ajoutez au moins un électeur, ou ouvrez le vote à tous.' : null;
