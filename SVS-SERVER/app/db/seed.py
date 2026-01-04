from datetime import datetime
import app.config.env  # Ensure env is loaded
from app.models import Candidate, Vote, User, AttributedVote, Bulletin
from app.utils.auth_utils import hash_string
from app.db import db_session, init_db, test_db_connection
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

hashed_password = hash_string("0000")

_setup = False


@db_session
async def setup(recreate: bool = False, db: AsyncSession | None = None):
    if db is None:
        logger.error("No database session provided for setup.")
        return

    await test_db_connection()
    await init_db(recreate=recreate)

    logger.info("Setup completed.")


def seed(func):
    async def wrapper(*args, **kwargs):
        global _setup
        if not _setup:
            recreate = (
                input(
                    "Do you want to recreate the database? This will erase all existing data. (y/n): "
                )
                .strip()
                .lower()
                == "y"
            )
            await setup(recreate=recreate)
            _setup = True
        return await func(*args, **kwargs)

    return wrapper


@seed
@db_session
async def seed_users(db: AsyncSession | None = None):
    if db is None:
        logger.error("No database session provided for seeding.")
        return
    users = [
        User(
            first_name="lyes",
            last_name="R",
            email="lyes.rabhi.020@gmail.com",
            verified_email=True,
            password=hashed_password,
            username="lyes",
            phone_number="555-1234",
            verified_phone_number=True,
            is_active=True,
            is_admin=True,
        ),
        User(
            first_name="john",
            last_name="doe",
            email="john.doe@example.com",
            verified_email=True,
            password=hashed_password,
            username="john",
            phone_number="555-5678",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
        ),
        User(
            first_name="jane",
            last_name="smith",
            email="jane.smith@example.com",
            verified_email=True,
            password=hashed_password,
            username="jane",
            phone_number="555-8765",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
        ),
    ]

    db.add_all(users)
    await db.commit()
    logger.info(f"Seeded {len(users)} users into the database.")


@seed
@db_session
async def seed_votes(db: AsyncSession | None = None):
    if db is None:
        logger.error("No database session provided for seeding votes.")
        return
    # Implement vote seeding logic here
    votes = [
        Vote(
            title="Election 2026",
            description="Presidential Election 2026 in France",
            start_date=datetime.strptime("2026-11-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2026-11-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Election 2024",
            description="Presidential Election 2024",
            start_date=datetime.strptime("2024-11-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-11-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Local Elections",
            description="City Council Elections",
            start_date=datetime.strptime("2024-10-15 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-10-16 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
        ),
        Vote(
            title="School Board Elections",
            description="Elections for the School Board Members",
            start_date=datetime.strptime("2024-09-20 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-09-21 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        Vote(
            title="Community Center Elections",
            description="Elections for the Community Center Committee",
            start_date=datetime.strptime("2024-12-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-12-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        Vote(
            title="Ongoing Election",
            description="An election currently in progress",
            start_date=datetime.strptime("2025-11-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2025-12-31 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Planned Election 2027",
            description="Planned future election",
            start_date=datetime.strptime("2027-05-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2027-05-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Past Election 2020",
            description="A completed election in the past",
            start_date=datetime.strptime("2020-06-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2020-06-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
    ]
    db.add_all(votes)
    await db.commit()
    logger.info(f"Seeded {len(votes)} votes into the database.")


@seed
@db_session
async def seed_candidates(db: AsyncSession | None = None):
    if db is None:
        logger.error("No database session provided for seeding votes.")
        return
    # Implement vote seeding logic here
    candidates = [
        Candidate(
            first_name="Alice",
            last_name="Johnson",
            photo_url="http://example.com/photos/alice.jpg",
            vote_id=1,
        ),
        Candidate(
            first_name="Bob",
            last_name="Williams",
            photo_url="http://example.com/photos/bob.jpg",
            vote_id=1,
        ),
        Candidate(
            first_name="Charlie",
            last_name="Brown",
            photo_url="http://example.com/photos/charlie.jpg",
            vote_id=2,
        ),
        Candidate(
            first_name="Diana",
            last_name="Prince",
            photo_url="http://example.com/photos/diana.jpg",
            vote_id=2,
            vote_count=8,
        ),
        Candidate(
            first_name="Ethan",
            last_name="Hunt",
            photo_url="http://example.com/photos/ethan.jpg",
            vote_id=3,
        ),
        Candidate(
            first_name="Fiona",
            last_name="Gallagher",
            photo_url="http://example.com/photos/fiona.jpg",
            vote_id=3,
        ),
        Candidate(
            first_name="George",
            last_name="Miller",
            photo_url="http://example.com/photos/george.jpg",
            vote_id=1,
        ),
        Candidate(
            first_name="Hannah",
            last_name="Davis",
            photo_url="http://example.com/photos/hannah.jpg",
            vote_id=2,
        ),
        Candidate(
            first_name="Ian",
            last_name="Clark",
            photo_url="http://example.com/photos/ian.jpg",
            vote_id=3,
        ),
        Candidate(
            first_name="Julia",
            last_name="Roberts",
            photo_url="http://example.com/photos/julia.jpg",
            vote_id=1,
        ),
        Candidate(
            first_name="Kevin",
            last_name="Spacey",
            photo_url="http://example.com/photos/kevin.jpg",
            vote_id=6,
        ),
        Candidate(
            first_name="Laura",
            last_name="Palmer",
            photo_url="http://example.com/photos/laura.jpg",
            vote_id=6,
        ),
        Candidate(
            first_name="Michael",
            last_name="Scott",
            photo_url="http://example.com/photos/michael.jpg",
            vote_id=6,
        ),
    ]
    db.add_all(candidates)
    await db.commit()
    logger.info(f"Seeded {len(candidates)} candidates into the database.")


@seed
@db_session
async def seed_attributedVotes(db: AsyncSession | None = None):
    if db is None:
        logger.error("No database session provided for seeding votes.")
        return
    # Implement vote seeding logic here
    votes = [
        AttributedVote(
            user_id=2,
            vote_id=1,
        ),
        AttributedVote(
            user_id=2,
            vote_id=2,
        ),
        AttributedVote(
            user_id=3,
            vote_id=2,
        ),
        AttributedVote(
            user_id=3,
            vote_id=3,
        ),
        AttributedVote(
            user_id=1,
            vote_id=1,
        ),
        AttributedVote(
            user_id=1,
            vote_id=3,
        ),
        AttributedVote(
            user_id=1,
            vote_id=2,
        ),
        AttributedVote(
            user_id=1,
            vote_id=6,
        ),
        AttributedVote(
            user_id=1,
            vote_id=7,
        ),
        AttributedVote(
            user_id=1,
            vote_id=8,
        ),
    ]
    db.add_all(votes)
    await db.commit()
    logger.info(f"Seeded {len(votes)} attributed votes into the database.")


@seed
@db_session
async def seed_bulletins(db: AsyncSession | None = None):
    from app.utils.auth_utils import encrypt_string

    if db is None:
        logger.error("No database session provided for seeding bulletins.")
        return
    # Implement vote seeding logic here
    bulletins = [
        Bulletin(
            user_id=2,
            vote_id=1,
            content=encrypt_string("1"),
            date=datetime.strptime("2024-11-01 10:00:00", "%Y-%m-%d %H:%M:%S"),
        ),
        Bulletin(
            user_id=3,
            vote_id=2,
            content=encrypt_string("2"),
            date=datetime.strptime("2024-10-15 11:30:00", "%Y-%m-%d %H:%M:%S"),
        ),
        Bulletin(
            user_id=1,
            vote_id=3,
            content=encrypt_string("4"),
            date=datetime.strptime("2024-09-20 09:15:00", "%Y-%m-%d %H:%M:%S"),
        ),
        Bulletin(
            user_id=1,
            vote_id=2,
            content=encrypt_string("3"),
            date=datetime.strptime("2024-11-01 14:45:00", "%Y-%m-%d %H:%M:%S"),
        ),
    ]
    db.add_all(bulletins)
    await db.commit()
    logger.info(f"Seeded {len(bulletins)} bulletins into the database.")


seeders = [
    seed_users,
    seed_votes,
    seed_candidates,
    seed_attributedVotes,
    seed_bulletins,
]


async def seed_all():
    for seeder in seeders:
        await seeder()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_all())
