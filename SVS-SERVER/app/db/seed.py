from datetime import datetime, timedelta
import app.config.env
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
            created_at=datetime.strptime("2024-01-15 08:00:00", "%Y-%m-%d %H:%M:%S"),
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
            created_at=datetime.strptime("2024-02-10 09:30:00", "%Y-%m-%d %H:%M:%S"),
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
            created_at=datetime.strptime("2024-03-05 10:15:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="alice",
            last_name="johnson",
            email="alice.johnson@example.com",
            verified_email=True,
            password=hashed_password,
            username="alice_j",
            phone_number="555-1111",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-04-20 11:45:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="bob",
            last_name="williams",
            email="bob.williams@example.com",
            verified_email=True,
            password=hashed_password,
            username="bob_w",
            phone_number="555-2222",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-05-12 14:20:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="carol",
            last_name="davis",
            email="carol.davis@example.com",
            verified_email=False,
            password=hashed_password,
            username="carol_d",
            phone_number="555-3333",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-06-08 07:50:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="david",
            last_name="miller",
            email="david.miller@example.com",
            verified_email=True,
            password=hashed_password,
            username="david_m",
            phone_number="555-4444",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime.strptime("2024-07-03 16:30:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="emma",
            last_name="wilson",
            email="emma.wilson@example.com",
            verified_email=True,
            password=hashed_password,
            username="emma_w",
            phone_number="555-5555",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-08-17 12:00:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="frank",
            last_name="brown",
            email="frank.brown@example.com",
            verified_email=True,
            password=hashed_password,
            username="frank_b",
            phone_number="555-6666",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-09-22 13:45:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="grace",
            last_name="taylor",
            email="grace.taylor@example.com",
            verified_email=False,
            password=hashed_password,
            username="grace_t",
            phone_number="555-7777",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-10-11 15:20:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="henry",
            last_name="anderson",
            email="henry.anderson@example.com",
            verified_email=True,
            password=hashed_password,
            username="henry_a",
            phone_number="555-8888",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-11-06 09:10:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="iris",
            last_name="thomas",
            email="iris.thomas@example.com",
            verified_email=True,
            password=hashed_password,
            username="iris_t",
            phone_number="555-9999",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime.strptime("2024-12-01 10:40:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="jack",
            last_name="jackson",
            email="jack.jackson@example.com",
            verified_email=True,
            password=hashed_password,
            username="jack_j",
            phone_number="555-0001",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-01-25 11:55:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="kate",
            last_name="white",
            email="kate.white@example.com",
            verified_email=True,
            password=hashed_password,
            username="kate_w",
            phone_number="555-0002",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-02-28 14:25:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="mia",
            last_name="martin",
            email="mia.martin@example.com",
            verified_email=True,
            password=hashed_password,
            username="mia_m",
            phone_number="555-0004",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-03-19 08:35:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="noah",
            last_name="garcia",
            email="noah.garcia@example.com",
            verified_email=True,
            password=hashed_password,
            username="noah_g",
            phone_number="555-0005",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime.strptime("2024-04-30 17:05:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="olivia",
            last_name="rodriguez",
            email="olivia.rodriguez@example.com",
            verified_email=True,
            password=hashed_password,
            username="olivia_r",
            phone_number="555-0006",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-05-18 13:15:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="paul",
            last_name="lee",
            email="paul.lee@example.com",
            verified_email=False,
            password=hashed_password,
            username="paul_l",
            phone_number="555-0007",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-06-25 10:50:00", "%Y-%m-%d %H:%M:%S"),
        ),
        User(
            first_name="quinn",
            last_name="lewis",
            email="quinn.lewis@example.com",
            verified_email=True,
            password=hashed_password,
            username="quinn_l",
            phone_number="555-0008",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.strptime("2024-07-14 15:35:00", "%Y-%m-%d %H:%M:%S"),
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
            title="Presidential 2024",
            description="Election for 2024",
            start_date=datetime.strptime("2024-07-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Local Election July 2",
            description="City Council July",
            start_date=datetime.strptime("2024-07-05 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-05 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
        ),
        Vote(
            title="School Board July 2",
            description="School Board Election",
            start_date=datetime.strptime("2024-07-10 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-10 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        Vote(
            title="Community Center July 2",
            description="Community Center Committee",
            start_date=datetime.strptime("2024-07-15 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-15 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Special Referendum July 2",
            description="Referendum Vote",
            start_date=datetime.strptime("2024-07-20 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-20 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
        ),
        Vote(
            title="Local Election August 1",
            description="City Council August",
            start_date=datetime.strptime("2024-08-03 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-08-03 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        Vote(
            title="School Board August 2",
            description="School Board Election",
            start_date=datetime.strptime("2024-08-10 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-08-10 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
        ),
        Vote(
            title="Community Center August 3",
            description="Community Center Committee",
            start_date=datetime.strptime("2024-08-15 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-08-15 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Special Referendum August 4",
            description="Referendum Vote",
            start_date=datetime.strptime("2024-08-20 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-08-20 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        Vote(
            title="Extra Election August 5",
            description="Extra Local Vote",
            start_date=datetime.strptime("2024-08-25 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-08-25 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        # Finished votes in July 2024
        Vote(
            title="Presidential 2024",
            description="Election finished",
            start_date=datetime.strptime("2024-07-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-02 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Local Election July",
            description="Finished",
            start_date=datetime.strptime("2024-07-03 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-04 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
        ),
        # Ongoing votes in July 2024
        Vote(
            title="Ongoing City Vote July",
            description="Vote that is still running",
            start_date=datetime.strptime("2024-07-01 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2026-12-31 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=3,
        ),
        # Upcoming votes in July 2024
        Vote(
            title="Planned Referendum July",
            description="Vote will start in the future",
            start_date=datetime.strptime("2024-07-25 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-26 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=1,
        ),
        Vote(
            title="Extra Local Vote July",
            description="Another planned vote",
            start_date=datetime.strptime("2024-07-28 00:00:00", "%Y-%m-%d %H:%M:%S"),
            end_date=datetime.strptime("2024-07-29 23:59:59", "%Y-%m-%d %H:%M:%S"),
            creator_id=2,
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
            vote_id=1,
            content=encrypt_string("1"),
            date=datetime.strptime("2024-11-01 10:00:00", "%Y-%m-%d %H:%M:%S"),
            voting_token="token_abc123",
            token_signature="signature_xyz789",
        ),
        Bulletin(
            vote_id=2,
            content=encrypt_string("2"),
            date=datetime.strptime("2024-10-15 11:30:00", "%Y-%m-%d %H:%M:%S"),
            voting_token="token_def456",
            token_signature="signature_uvw123",
        ),
        Bulletin(
            vote_id=3,
            content=encrypt_string("4"),
            date=datetime.strptime("2024-09-20 09:15:00", "%Y-%m-%d %H:%M:%S"),
            voting_token="token_ghi789",
            token_signature="signature_rst456",
        ),
        Bulletin(
            vote_id=2,
            content=encrypt_string("3"),
            date=datetime.strptime("2024-11-01 14:45:00", "%Y-%m-%d %H:%M:%S"),
            voting_token="token_jkl012",
            token_signature="signature_opq789",
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
