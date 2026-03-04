from fastapi_crons import Crons
from fastapi_crons.state import RedisStateBackend
from app.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from sqlalchemy.future import select
from loguru import logger
from fastapi import FastAPI
from app.utils.db_utils import get_async_redis_connection


class CronsInstance:
    def __init__(self, app: FastAPI, state_backend) -> None:
        self.crons = Crons(app=app, state_backend=state_backend)
        self.votes_in_progress = set()

    def register_cron_jobs(self):

        # run every second for testing:
        # @self.crons.cron("* * * * * *")  # Runs every second for testing
        @self.crons.cron("* * * * *")  # Runs every minute
        @db_session
        async def decompte_des_votes(db: AsyncSession | None = None):
            from app.utils.vote_utils import get_vote_count
            from app.models.vote import Vote

            if db is None:
                raise ValueError("Database session is None")
            now = datetime.now()

            logger.debug(f"cron job with db: {db.bind.url}")

            logger.info("Checking for votes to be counted...")

            votes = await db.execute(
                select(Vote).where(Vote.end_date <= now, Vote.has_been_counted == False)
            )
            # count all votes for testing:
            # votes = await db.execute(select(Vote).where(Vote.id == 13))
            votes = votes.scalars().all()

            logger.info(f"Found {len(votes)} votes to be counted.")
            for vote in votes:
                if vote.id in self.votes_in_progress:
                    logger.info(
                        f"Vote ID {vote.id} is already being counted, skipping."
                    )
                    continue
                self.votes_in_progress.add(vote.id)
                try:
                    if vote.id is None:
                        logger.error(f"Vote ID is None for vote: {vote}")
                        continue
                    logger.info(f"Counting votes for vote ID {vote.id}")
                    vote_count, failures = await get_vote_count(
                        vote.id,
                    )
                    vote.has_been_counted = True
                    """ for candidate_id, count in vote_count.items():
                        logger.info(
                            f"Candidate ID {candidate_id} received {count} votes"
                        )
                        candidate = await db.get(Candidate, candidate_id)
                        if candidate:
                            candidate.vote_count = (candidate.vote_count or 0) + count
                        else:
                            logger.error(f"Candidate ID {candidate_id} not found")
                     """
                    if failures:
                        logger.warning(
                            f"Failed to count votes for vote ID {vote.id}: {failures}"
                        )
                except Exception as e:
                    logger.error(f"Error counting votes for vote ID {vote.id}: {e}")
                self.votes_in_progress.remove(vote.id)
            await db.commit()


async def start_crons(app: FastAPI):
    logger.info("Starting cron jobs...")
    redis = await get_async_redis_connection()
    redis_state_backend = RedisStateBackend(redis_client=redis)
    crons_instance = CronsInstance(app=app, state_backend=redis_state_backend)
    crons_instance.register_cron_jobs()
    await crons_instance.crons.start()
    logger.info("Cron jobs started.")
    return True
