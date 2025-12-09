from app.models.user import User
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bulletin import Bulletin
from fastapi import Request, HTTPException
from app.models.error_codes import ERROR_CODES
from sqlalchemy.future import select
from app.utils.auth_utils import decrypt_string
from loguru import logger
from app.models.vote import Vote
from app.models.candidate import Candidate


@db_session
async def get_vote_count(
    vote_id: int, user: User, db: AsyncSession | None = None
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
    logger.error(
        f"Vote count results: {candidate_vote_counts} failures: {count_failures}"
    )
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
