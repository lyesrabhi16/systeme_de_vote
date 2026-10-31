import random
from datetime import timedelta

from faker import Faker
from loguru import logger

from app.db import db_session
from app.models import AttributedVote, Bulletin, Candidate, User, Vote
from app.utils.auth_utils import encrypt_string, hash_string

fake = Faker()
hashed_password = hash_string("0000")


@db_session
async def seed_more_users(db=None, n=50):
    if db is None:
        logger.error("No database session provided.")
        return
    users = []
    for _ in range(n):
        first_name = fake.first_name()
        last_name = fake.last_name()
        users.append(
            User(
                first_name=first_name,
                last_name=last_name,
                email=fake.unique.email(),
                verified_email=random.choice([True, False]),
                password=hashed_password,
                username=fake.unique.user_name(),
                phone_number=fake.phone_number(),
                verified_phone_number=random.choice([True, False]),
                is_active=True,
                is_admin=False,
            )
        )
    db.add_all(users)
    await db.commit()
    logger.info(f"Seeded {n} additional users.")


@db_session
async def seed_more_votes(db=None, n=20):
    if db is None:
        logger.error("No database session provided.")
        return
    votes = []
    for _ in range(n):
        start_date = fake.date_time_between(start_date="-2y", end_date="now")
        end_date = start_date + timedelta(days=random.randint(1, 5))
        votes.append(
            Vote(
                title=fake.sentence(nb_words=3),
                description=fake.sentence(nb_words=8),
                start_date=start_date,
                end_date=end_date,
                creator_id=random.randint(1, 50),
            )
        )
    db.add_all(votes)
    await db.commit()
    logger.info(f"Seeded {n} additional votes.")


@db_session
async def seed_more_candidates(db=None, n=100):
    if db is None:
        logger.error("No database session provided.")
        return
    candidates = []
    for _ in range(n):
        candidates.append(
            Candidate(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                photo_url=fake.image_url(),
                vote_id=random.randint(1, 20),
                vote_count=random.randint(0, 50),
            )
        )
    db.add_all(candidates)
    await db.commit()
    logger.info(f"Seeded {n} additional candidates.")


@db_session
async def seed_more_attributed_votes(db=None, n=100):
    if db is None:
        logger.error("No database session provided.")
        return
    for _ in range(n):
        av = AttributedVote(
            user_id=random.randint(1, 50),
            vote_id=random.randint(1, 20),
        )
        # Avoid duplicate attributed votes
        try:
            db.add(av)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.warning(f"Duplicate attributed vote for user {av.user_id} and vote {av.vote_id}, skipping.")
            continue
    await db.commit()
    logger.info(f"Seeded {n} additional attributed votes.")


@db_session
async def seed_more_bulletins(db=None, n=100):
    if db is None:
        logger.error("No database session provided.")
        return
    for _ in range(n):
        b = Bulletin(
            user_id=random.randint(1, 50),
            vote_id=random.randint(1, 20),
            content=encrypt_string(str(random.randint(1, 10))),
            date=fake.date_time_between(start_date="-1y", end_date="now"),
        )
        try:
            db.add(b)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.warning(f"Failed to add bulletin for user {b.user_id} and vote {b.vote_id}, skipping.")
            continue
    await db.commit()
    logger.info(f"Seeded {n} additional bulletins.")


async def seed_all_more():
    await seed_more_users()
    await seed_more_votes()
    await seed_more_candidates()
    await seed_more_attributed_votes()
    await seed_more_bulletins()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_all_more())
