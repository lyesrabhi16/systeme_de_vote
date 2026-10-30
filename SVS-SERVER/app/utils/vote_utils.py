import asyncio
import json
from math import gcd, lcm

from fastapi import HTTPException
from loguru import logger
from phe import paillier
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config.env import env
from app.db.db import db_session
from app.models.bulletin import Bulletin
from app.models.candidate import Candidate
from app.models.error_codes import ERROR_CODES
from app.models.vote import Vote
from app.models.voting_models import VoteCastData


class InvalidBallot(ValueError):
    """The ballot is not one the election can count (and the message says why, for the log: the voter is only told it was refused)."""


# --- Paillier Key Generation ---
def gen_encryption_key_pair():
    """Generate a Paillier public/private key pair for an election."""
    public_key, private_key = paillier.generate_paillier_keypair(n_length=env.PAILLIER_KEY_BITS)
    return {
        "PUBLIC_KEY": json.dumps({"n": str(public_key.n), "g": str(public_key.g)}),
        "PRIVATE_KEY": json.dumps({"p": str(private_key.p), "q": str(private_key.q)}),
    }


def load_public_key(serialized: str) -> paillier.PaillierPublicKey:
    """The public key of an election. g is n + 1, whatever the stored text says: the proofs and the sums assume it."""
    data = json.loads(serialized)
    public_key = paillier.PaillierPublicKey(n=int(data["n"]))
    if int(data["g"]) != public_key.g:
        raise ValueError("The generator of the key is not n + 1")
    return public_key


# --- Checking a ballot ---
def parse_ciphertext(value: str, n_square: int, n: int) -> int:
    try:
        number = int(value)
    except ValueError as e:
        raise InvalidBallot("a ciphertext is not a number") from e
    if not 0 < number < n_square or gcd(number, n) != 1:
        raise InvalidBallot("a ciphertext is not an element of Z*_n²")
    return number


def check_ballot(public_key: paillier.PaillierPublicKey, candidate_ids: set[int], data: VoteCastData) -> dict[int, int]:
    """
    Checks a whole ballot, or refuses it: one entry for each candidate of the election and nothing else, each an encryption of
    0 or 1 (with its proof), and the sum of all of them an encryption of 0 or 1 (with its proof): at most one candidate.
    Answers the ciphertext of each candidate. This is CPU work (a few modular exponentiations of 4096 bits per candidate):
    in a thread, never on the event loop.
    """
    n, n_square = public_key.n, public_key.nsquare
    ids = [entry.candidate_id for entry in data.content]
    if len(ids) != len(set(ids)):
        raise InvalidBallot("a candidate appears twice")
    if set(ids) != candidate_ids:
        raise InvalidBallot("the ballot must have one entry for each candidate of the election, and no other")

    ciphertexts: dict[int, int] = {}
    for entry in data.content:
        ciphertext = parse_ciphertext(entry.encrypted_value, n_square, n)
        if not entry.proof.verify(public_key, ciphertext):
            raise InvalidBallot(f"the proof for candidate {entry.candidate_id} is not valid")
        ciphertexts[entry.candidate_id] = ciphertext

    total = 1
    for ciphertext in ciphertexts.values():
        total = total * ciphertext % n_square
    if not data.sum_proof.verify(public_key, total):
        raise InvalidBallot("the proof that at most one candidate is chosen is not valid")
    return ciphertexts


# --- Counting ---
def decryption_witness(private_key: paillier.PaillierPrivateKey, ciphertext: int, count: int) -> int:
    """
    A proof that `ciphertext` encrypts `count`: the n-th root r of ciphertext * g^(-count) (which is a perfect n-th power
    exactly when that is the plaintext). Anyone can check it with the public key alone (see `decryption_is_correct`),
    and it says nothing about the key: r is the randomness of the sum, not of any ballot.
    """
    public_key = private_key.public_key
    n, n_square = public_key.n, public_key.nsquare
    base = ciphertext * pow(public_key.g, -count, n_square) % n_square
    return pow(base % n, pow(n, -1, lcm(private_key.p - 1, private_key.q - 1)), n)


def decryption_is_correct(public_key: paillier.PaillierPublicKey, ciphertext: int, count: int, witness: int) -> bool:
    n, n_square = public_key.n, public_key.nsquare
    if not 0 < witness < n or not 0 <= count < n:
        return False
    return pow(witness, n, n_square) == ciphertext * pow(public_key.g, -count, n_square) % n_square


def tally(
    public_key: paillier.PaillierPublicKey,
    private_key: paillier.PaillierPrivateKey,
    candidate_ids: set[int],
    ballots: list[tuple[int, str]],
) -> tuple[dict[int, int], dict[int, int], dict[int, int], list[int]]:
    """
    The product of the ciphertexts of the valid ballots, for each candidate (it encrypts the sum, by the homomorphic property),
    its decryption and the proof of it. A ballot that is not valid as a whole is left out as a whole, and reported.
    Answers (counts, encrypted tallies, decryption proofs, the ids of the ballots left out).
    """
    n_square = public_key.nsquare
    encrypted = dict.fromkeys(candidate_ids, 1)  # 1 is the encryption of 0 with randomness 1: nothing secret, and anyone can recompute it
    left_out: list[int] = []
    for bulletin_id, content in ballots:
        try:
            ciphertexts = check_ballot(public_key, candidate_ids, VoteCastData.model_validate_json(content))
        except (InvalidBallot, ValidationError, ValueError) as e:
            logger.warning(f"Ballot {bulletin_id} is left out of the count: {e}")
            left_out.append(bulletin_id)
            continue
        for candidate_id, ciphertext in ciphertexts.items():
            encrypted[candidate_id] = encrypted[candidate_id] * ciphertext % n_square
    counts = {candidate_id: int(private_key.raw_decrypt(total)) for candidate_id, total in encrypted.items()}
    proofs = {
        candidate_id: decryption_witness(private_key, encrypted[candidate_id], count)
        for candidate_id, count in counts.items()
    }
    return counts, encrypted, proofs, left_out


@db_session
async def get_vote_count(
    vote_id: int,
    db: AsyncSession | None = None,
) -> tuple[dict[int, int], list[dict]]:
    """
    Counts an election that is finished, with Paillier's homomorphic addition: the ballots are never decrypted one by one.
    It leaves the election counted: the result of each candidate, the encrypted sums and the proofs that they decrypt to it.
    Counting again gives the same, so a second run (the cron and an administrator at the same time) does no harm.
    Answers (the count of each candidate, the ballots that were left out).
    """
    if db is None:
        raise ValueError("Database session is None")

    vote = await db.get(Vote, vote_id)
    if vote is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if not vote.is_vote_finished():
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_NOT_FINISHED)

    bulletins = (await db.execute(select(Bulletin).where(Bulletin.vote_id == vote_id).order_by(Bulletin.id))).scalars().all()
    candidates = (await db.execute(select(Candidate).where(Candidate.vote_id == vote_id))).scalars().all()
    public_key = load_public_key(vote.public_key)
    private_key = vote.get_private_key()

    counts, encrypted, proofs, left_out = await asyncio.to_thread(
        tally, public_key, private_key, {c.id for c in candidates}, [(b.id, b.content) for b in bulletins]
    )

    failures = [b.model_dump() for b in bulletins if b.id in left_out]  # before the commit, which expires what was loaded
    total_bulletins = len(bulletins)
    for candidate in candidates:
        candidate.vote_count = counts[candidate.id]
        db.add(candidate)
    vote.encrypted_tally = json.dumps({str(k): str(v) for k, v in sorted(encrypted.items())})
    vote.tally_proof = json.dumps({str(k): str(v) for k, v in sorted(proofs.items())})
    vote.has_been_counted = True
    db.add(vote)
    await db.commit()

    logger.info(f"Election {vote_id} counted: {total_bulletins - len(failures)} ballots, {len(failures)} left out")
    return counts, failures
