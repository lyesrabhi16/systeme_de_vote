import json

from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import bulletin
from app.models.bulletin import Bulletin
from fastapi import HTTPException
from app.models.error_codes import ERROR_CODES
from sqlalchemy.future import select
from loguru import logger
from app.models.vote import Vote
from app.models.candidate import Candidate
from phe import paillier
from app.config.env import env
from app.models.voting_models import VoteCastContentModel


# --- Paillier Key Generation ---
def gen_encryption_key_pair():  # -> dict[str, Any]:
    """Generate a Paillier public/private key pair."""
    public_key, private_key = paillier.generate_paillier_keypair(n_length=env.PAILLIER_KEY_BITS)
    return {
        "PUBLIC_KEY": json.dumps({"n": str(public_key.n), "g": str(public_key.g)}),
        "PRIVATE_KEY": json.dumps({"p": str(private_key.p), "q": str(private_key.q)}),
    }


# --- Homomorphically sum votes ---
@db_session
async def get_vote_count(
    vote_id: int,
    db: AsyncSession | None = None,
) -> tuple[dict[int, int], list[Bulletin]]:
    """Count votes using Paillier homomorphic encryption."""
    logger.debug(
        f"Getting vote count for vote ID {vote_id} with db: {db.bind.url if db else 'None'}"
    )
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
    # logger.debug(f"Found {len(bulletins)} bulletins for vote ID {vote_id}")
    public_key_data = json.loads(vote.public_key)
    # logger.debug(f"Loaded public key data: {public_key_data}")
    public_key = paillier.PaillierPublicKey(n=int(public_key_data["n"]))
    # logger.debug(
    #    f"Constructed Paillier public key: n={public_key.n}, g={public_key.g} n2={public_key.nsquare}"
    # )
    private_key = vote.get_private_key()
    # logger.debug(f"Constructed Paillier private key: p={private_key.p}, q={private_key.q}")

    # Initialize encrypted vote totals
    candidate_totals = {
        candidate.id: public_key.encrypt(0) for candidate in vote.candidates
    }
    count_failures = []
    # logger.debug(f"Initialized candidate totals: {candidate_totals}")
    # logger.debug(
    #    f"Processing {len(bulletins)} bulletins for vote ID {vote_id} with candidates: {list(candidate_totals.keys())}"
    # )
    for bulletin in bulletins:
        try:
            # The content is expected to be a JSON list string with maps of VoteCastContent
            values = json.loads(bulletin.content)
            logger.debug(f"Decrypted bulletin {bulletin.id} content: {values}")
            value_map = {
                int(v["candidate_id"]): VoteCastContentModel(**v) for v in values
            }
            #       logger.debug(
            #           f"Constructed value map for bulletin {bulletin.id}: {value_map}"
            #       )
            logger.debug
            #       (
            #           f"Processing bulletin {bulletin.id} for vote ID {vote_id} with candidates: {list(candidate_totals.keys())}"
            #       )
            for candidate_id in candidate_totals.keys():
                #           logger.debug(
                #               f"Processing candidate ID {candidate_id} in bulletin {bulletin.id}"
                #           )
                data = value_map.get(candidate_id, None)
                #          logger.debug(
                #              f"Extracted data for candidate ID {candidate_id} in bulletin {bulletin.id}: {data}"
                #          )
                proof = data.proof if data else None
                if data and not proof:
                    logger.warning(
                        f"Missing proof for candidate ID {candidate_id} in bulletin {bulletin.id}"
                    )
                    count_failures.append(bulletin.model_dump())
                    continue
                if proof:
                    #             logger.debug("###ZKP")
                    proof_check = proof.verify(public_key, int(data.encrypted_value))
                    if not proof_check:
                        logger.warning(
                            f"Invalid proof for candidate ID {candidate_id} in bulletin {bulletin.id}"
                        )
                        count_failures.append(bulletin.model_dump())
                        continue
                #            logger.debug(f"Passed Proof Checks: {proof_check}")
                encrypted_number = (
                    paillier.EncryptedNumber(public_key, int(data.encrypted_value))
                    if data
                    else public_key.encrypt(0)
                )

                # logger.debug(
                #   f"Adding encrypted votes for candidate ID {candidate_id}: current total {candidate_totals[candidate_id]}, adding {data}"
                # )
                # decrypted_data = private_key.raw_decrypt(data)
                # logger.debug(
                #    f"type of  decrypted_data: {type(decrypted_data)} Decrypted data for candidate ID {candidate_id}: {decrypted_data}"
                # )
                # logger.debug(
                #    f"#VOTE_ID#{vote_id}# adding {private_key.decrypt(data)} to total for candidate ID {candidate_id}"
                # )
                candidate_totals[candidate_id] += encrypted_number
        except Exception as e:
            logger.error(f"Failed to decrypt bulletin {bulletin.id}: {e}")
            count_failures.append(bulletin.model_dump())

    # Convert encrypted totals to plaintext counts
    plaintext_candidate_totals = {}
    for candidate_id in candidate_totals.keys():
        # Decrypt the total votes for each candidate
        # logger.debug(
        #    f"Decrypting total votes for candidate ID {candidate_id} {candidate_totals[candidate_id]}"
        # )
        plaintext_candidate_totals[candidate_id] = private_key.decrypt(
            candidate_totals[candidate_id]
        )
    logger.debug(f"Decrypted candidate totals: {plaintext_candidate_totals}")
    # Update DB counts
    for candidate in vote.candidates:
        db_candidate: Candidate | None = await db.get(Candidate, candidate.id)
        if db_candidate:
            db_candidate.vote_count = plaintext_candidate_totals[candidate.id]
            db.add(db_candidate)
    await db.commit()

    logger.debug(
        f"Vote count results: {plaintext_candidate_totals}, failures: {count_failures}"
    )
    return plaintext_candidate_totals, count_failures
