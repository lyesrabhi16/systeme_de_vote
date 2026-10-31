"""The voter of app/utils/ballot_maker.py, and the ways of cheating that the tests try against the verifier."""

from phe import PaillierPublicKey

from app.models.voting_models import VoteCastContentModel, VoteCastData
from app.utils.ballot_maker import encrypt, make_ballot, prove_binary

__all__ = ["encrypt", "make_ballot", "make_ballot_for_several", "prove_binary"]


def make_ballot_for_several(public_key: PaillierPublicKey, candidate_ids: list[int], chosen: list[int]) -> VoteCastData:
    """
    What a cheating voter can build: each entry is an honest, proven 0 or 1, but several are 1. The sum is then an encryption of
    `len(chosen)`; no honest proof exists for it, so the "proof" of the sum is the best a cheater can do: the one for a 1, with the
    randomness that goes with the sum.
    """
    n_sq = public_key.nsquare
    entries, total, total_r = [], 1, 1
    for candidate_id in candidate_ids:
        value = 1 if candidate_id in chosen else 0
        ciphertext, r = encrypt(public_key, value)
        entries.append(
            VoteCastContentModel(
                candidate_id=candidate_id,
                encrypted_value=str(ciphertext),
                proof=prove_binary(public_key, ciphertext, value, r),
            )
        )
        total, total_r = total * ciphertext % n_sq, total_r * r % public_key.n
    return VoteCastData(content=entries, sum_proof=prove_binary(public_key, total, 1, total_r))
