from fastapi import FastAPI, HTTPException
from fastapi_crons import Crons
from fastapi_crons.state import RedisStateBackend
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import db_session
from app.models.types import utcnow
from app.utils.db_utils import get_redis_connection


class CronsInstance:
    def __init__(self, app: FastAPI, state_backend) -> None:
        self.crons = Crons(app=app, state_backend=state_backend)
        self.votes_in_progress: set[int] = set()

    def register_cron_jobs(self):
        # run every second for testing: @self.crons.cron("* * * * * *")
        @self.crons.cron("* * * * *")  # every minute
        async def decompte_des_votes():
            await count_finished_votes(self.votes_in_progress)


@db_session
async def finished_uncounted_vote_ids(db: AsyncSession | None = None) -> list[int]:
    from app.models.vote import Vote

    if db is None:
        raise ValueError("Database session is None")
    rows = await db.execute(select(Vote.id).where(Vote.end_date <= utcnow(), Vote.has_been_counted == False))  # noqa: E712
    return list(rows.scalars().all())


async def count_finished_votes(in_progress: set[int] | None = None) -> list[int]:
    """
    Counts the elections that are finished and not counted yet, each one on its own: one that cannot be counted is logged
    and the others are counted all the same. Answers the ids of those that were counted.
    """
    from app.utils.vote_utils import get_vote_count

    in_progress = in_progress if in_progress is not None else set()
    counted: list[int] = []
    vote_ids = await finished_uncounted_vote_ids()
    logger.info(f"{len(vote_ids)} votes to be counted.")
    for vote_id in vote_ids:
        if vote_id in in_progress:
            continue
        in_progress.add(vote_id)
        try:
            _, failures = await get_vote_count(vote_id)
            counted.append(vote_id)
            if failures:
                logger.warning(f"{len(failures)} ballots of vote {vote_id} were left out of the count")
        except HTTPException as e:
            logger.error(f"Vote {vote_id} cannot be counted: {e.detail}")
        except Exception:
            logger.exception(f"Error counting vote {vote_id}")
        finally:
            in_progress.discard(vote_id)
    return counted


async def start_crons(app: FastAPI):
    logger.info("Starting cron jobs...")
    redis = get_redis_connection()
    redis_state_backend = RedisStateBackend(redis_client=redis)
    crons_instance = CronsInstance(app=app, state_backend=redis_state_backend)
    crons_instance.register_cron_jobs()
    await crons_instance.crons.start()
    logger.info("Cron jobs started.")
    return True
