from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bulletin import Bulletin
from fastapi import HTTPException
from app.models.error_codes import ERROR_CODES
from sqlalchemy.future import select
from app.utils.auth_utils import decrypt_string
from loguru import logger
from app.models.vote import Vote
from app.models.candidate import Candidate
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization


async def verify_blind_signature(
    vote_id: int,
    blinded_token: int,
    blind_signature: int,
    public_key: rsa.RSAPublicKey | str,
) -> bool:
    """Verify the blind signature using the vote's public key."""
    if isinstance(public_key, str):
        public_key = serialization.load_pem_public_key(
            public_key.encode("utf-8"),
        )
    numbers = public_key.public_numbers()
    n, e = numbers.n, numbers.e

    recovered = pow(blind_signature, e, n)
    return recovered == blinded_token


async def generate_blind_signature(
    private_key: rsa.RSAPrivateKey | str, blinded_token: int
) -> int:
    """Sign the blinded token using the provided private key."""
    if isinstance(private_key, str):
        private_key = serialization.load_pem_private_key(
            private_key.encode("utf-8"),
            password=None,
        )
    numbers = private_key.private_numbers()
    n = numbers.public_numbers.n
    d = numbers.d
    logger.debug(f"Generating blind signature with n={n} d={d}")
    return pow(blinded_token, d, n)


def gen_encryption_key_pair():
    """Generate a new asymmetric key pair."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    pem_private = private_key.private_bytes(
        encryption_algorithm=serialization.NoEncryption(),
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
    )
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return {
        "PRIVATE_KEY": pem_private.decode("utf-8"),
        "PUBLIC_KEY": pem_public.decode("utf-8"),
    }


@db_session
async def get_vote_count(
    vote_id: int, db: AsyncSession | None = None
) -> tuple[dict[int, int], list[Bulletin]]:
    """count, set and return the total number of votes for each candidate of a given vote ID."""
    if db is None:
        raise ValueError("Database session is None")
    vote = await Vote.get_by_id(vote_id)
    if vote is None:
        raise HTTPException(
            status_code=404,
            detail=ERROR_CODES.NOT_FOUND,
        )

    bulletins = await db.execute(select(Bulletin).where(Bulletin.vote_id == vote_id))

    bulletins = bulletins.scalars().all()

    candidate_vote_counts = {candidate.id: 0 for candidate in vote.candidates}

    count_failures = []
    for bulletin in bulletins:
        try:
            decrypted_candidate_id = int(decrypt_string(bulletin.content))
            if decrypted_candidate_id in candidate_vote_counts:
                candidate_vote_counts[decrypted_candidate_id] += 1
            else:
                logger.warning(
                    f"Decrypted Candidate ID {decrypted_candidate_id} not found among candidates for vote {vote_id}, bulletin {bulletin} is invalid."
                )
                count_failures.append(bulletin.model_dump())

        except Exception as e:
            logger.error(
                f"Failed to decrypt bulletin content for bulletin {bulletin} : {e}"
            )
            count_failures.append(bulletin.model_dump())
            continue

    for candidate in vote.candidates:
        db_candidate: Candidate | None = await db.get(Candidate, candidate.id)
        if db_candidate:
            db_candidate.vote_count = candidate_vote_counts.get(candidate.id, 0)
    await db.commit()

    for candidate in vote.candidates:
        logger.debug(
            f"Candidate {candidate.id} has {candidate.vote_count} votes for vote {vote_id}"
        )
    logger.error(
        f"Vote count results: {candidate_vote_counts} failures: {count_failures}"
    )

    return (candidate_vote_counts, count_failures)
