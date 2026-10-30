"""
A voter, for the tests: encrypts a choice and proves it, the way the web client does (paillier_encryption_utils.ts).
The server only ever verifies; this is the other half, so that the verifier is tested against honest ballots and against forged ones.
"""

import secrets
from math import gcd

from phe import PaillierPublicKey

from app.models.voting_models import CHALLENGE_MASK, BinaryZKProofModel, VoteCastContentModel, VoteCastData, fs_hash


def _random_unit(n: int) -> int:
    while True:
        r = secrets.randbelow(n - 1) + 1
        if gcd(r, n) == 1:
            return r


def encrypt(public_key: PaillierPublicKey, value: int) -> tuple[int, int]:
    """(ciphertext, randomness): c = g^value * r^n mod n²."""
    n, n_sq = public_key.n, public_key.nsquare
    r = _random_unit(n)
    return pow(public_key.g, value, n_sq) * pow(r, n, n_sq) % n_sq, r


def prove_binary(public_key: PaillierPublicKey, ciphertext: int, value: int, r: int) -> BinaryZKProofModel:
    """A proof that `ciphertext`, the encryption of `value` (0 or 1) with randomness r, encrypts 0 or 1."""
    n, g, n_sq = public_key.n, public_key.g, public_key.nsquare
    c_over_g = ciphertext * pow(g, -1, n_sq) % n_sq
    u = _random_unit(n)
    a_real = pow(u, n, n_sq)
    e_fake = secrets.randbits(128)
    z_fake = _random_unit(n)
    if value == 0:
        # real: "c encrypts 0" (branch 0). simulated: "c/g encrypts 0" (branch 1)
        a1 = pow(z_fake, n, n_sq) * pow(pow(c_over_g, e_fake, n_sq), -1, n_sq) % n_sq
        e = fs_hash([n, g, ciphertext, a_real, a1], n)
        e0, e1, z1 = e ^ e_fake, e_fake, z_fake
        z0 = u * pow(r, e0, n) % n
        a0 = a_real
    elif value == 1:
        a0 = pow(z_fake, n, n_sq) * pow(pow(ciphertext, e_fake, n_sq), -1, n_sq) % n_sq
        e = fs_hash([n, g, ciphertext, a0, a_real], n)
        e0, e1, z0 = e_fake, e ^ e_fake, z_fake
        z1 = u * pow(r, e1, n) % n
        a1 = a_real
    else:
        raise ValueError("a proof is for 0 or 1")
    assert 0 <= e0 <= CHALLENGE_MASK and 0 <= e1 <= CHALLENGE_MASK
    return BinaryZKProofModel(a0=str(a0), a1=str(a1), e0=str(e0), e1=str(e1), z0=str(z0), z1=str(z1))


def make_ballot(public_key: PaillierPublicKey, candidate_ids: list[int], choice: int | None) -> VoteCastData:
    """A ballot for `choice` (a candidate id), or a blank one (None)."""
    n_sq = public_key.nsquare
    entries, total, total_r = [], 1, 1
    for candidate_id in candidate_ids:
        value = 1 if candidate_id == choice else 0
        ciphertext, r = encrypt(public_key, value)
        entries.append(
            VoteCastContentModel(
                candidate_id=candidate_id,
                encrypted_value=str(ciphertext),
                proof=prove_binary(public_key, ciphertext, value, r),
            )
        )
        total, total_r = total * ciphertext % n_sq, total_r * r % public_key.n
    sum_value = 0 if choice is None else 1
    return VoteCastData(content=entries, sum_proof=prove_binary(public_key, total, sum_value, total_r))


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
