import { ERROR_CODES } from '@/api/client';

const MESSAGES: Record<string, string> = {
  [ERROR_CODES.ALREADY_VOTED]: 'Vous avez déjà voté dans cette élection.',
  [ERROR_CODES.VOTE_FINISHED]: 'Cette élection est terminée.',
  [ERROR_CODES.VOTE_NOT_STARTED]: "Cette élection n'est pas encore ouverte.",
  [ERROR_CODES.NOT_ELIGIBLE]: "Vous n'êtes pas inscrit sur la liste électorale de cette élection.",
  [ERROR_CODES.INVALID_BALLOT]: "Votre bulletin n'a pas pu être validé. Rechargez la page et réessayez.",
};
const DEFAULT_MESSAGE = "Une erreur est survenue lors de l'enregistrement de votre vote. Veuillez réessayer.";

export type CastFailure = {
  /** what to tell the voter */
  message: string;
  /** the server says this voter has voted already */
  alreadyVoted: boolean;
  /** the election is over: the page must stop offering the ballot */
  closed: boolean;
  /** another try cannot work (the choice is dropped); otherwise the voter may try again */
  final: boolean;
};

/** What a refused ballot means for the page: the message, and whether the vote can still be tried. */
export const interpretCastError = (err: unknown): CastFailure => {
  const code = (err as { response?: { data?: { detail?: { code?: string } } } })?.response?.data?.detail?.code ?? '';
  return {
    message: MESSAGES[code] ?? DEFAULT_MESSAGE,
    alreadyVoted: code === ERROR_CODES.ALREADY_VOTED,
    closed: code === ERROR_CODES.VOTE_FINISHED,
    final: [ERROR_CODES.ALREADY_VOTED, ERROR_CODES.VOTE_FINISHED, ERROR_CODES.VOTE_NOT_STARTED, ERROR_CODES.NOT_ELIGIBLE].includes(
      code as ERROR_CODES,
    ),
  };
};
