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
            phone_number="555-1001",
            verified_phone_number=True,
            is_active=True,
            is_admin=True,
            created_at=datetime(2024, 1, 15, 8, 0),
        ),
        User(
            first_name="john",
            last_name="doe",
            email="john.doe@example.com",
            verified_email=True,
            password=hashed_password,
            username="john",
            phone_number="555-1002",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 2, 10, 9, 30),
        ),
        User(
            first_name="jane",
            last_name="smith",
            email="jane.smith@example.com",
            verified_email=True,
            password=hashed_password,
            username="jane",
            phone_number="555-1003",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 3, 5, 10, 15),
        ),
        User(
            first_name="alice",
            last_name="johnson",
            email="alice.johnson@example.com",
            verified_email=True,
            password=hashed_password,
            username="alice_j",
            phone_number="555-1004",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 4, 20, 11, 45),
        ),
        User(
            first_name="bob",
            last_name="williams",
            email="bob.williams@example.com",
            verified_email=True,
            password=hashed_password,
            username="bob_w",
            phone_number="555-1005",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 5, 12, 14, 20),
        ),
        User(
            first_name="carol",
            last_name="davis",
            email="carol.davis@example.com",
            verified_email=False,
            password=hashed_password,
            username="carol_d",
            phone_number="555-1006",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 6, 8, 7, 50),
        ),
        User(
            first_name="david",
            last_name="miller",
            email="david.miller@example.com",
            verified_email=True,
            password=hashed_password,
            username="david_m",
            phone_number="555-1007",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime(2024, 7, 3, 16, 30),
        ),
        User(
            first_name="emma",
            last_name="wilson",
            email="emma.wilson@example.com",
            verified_email=True,
            password=hashed_password,
            username="emma_w",
            phone_number="555-1008",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 8, 17, 12, 0),
        ),
        User(
            first_name="frank",
            last_name="brown",
            email="frank.brown@example.com",
            verified_email=True,
            password=hashed_password,
            username="frank_b",
            phone_number="555-1009",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 9, 22, 13, 45),
        ),
        User(
            first_name="grace",
            last_name="taylor",
            email="grace.taylor@example.com",
            verified_email=False,
            password=hashed_password,
            username="grace_t",
            phone_number="555-1010",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 10, 11, 15, 20),
        ),
        User(
            first_name="henry",
            last_name="anderson",
            email="henry.anderson@example.com",
            verified_email=True,
            password=hashed_password,
            username="henry_a",
            phone_number="555-1011",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 11, 6, 9, 10),
        ),
        User(
            first_name="iris",
            last_name="thomas",
            email="iris.thomas@example.com",
            verified_email=True,
            password=hashed_password,
            username="iris_t",
            phone_number="555-1012",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime(2024, 12, 1, 10, 40),
        ),
        User(
            first_name="jack",
            last_name="jackson",
            email="jack.jackson@example.com",
            verified_email=True,
            password=hashed_password,
            username="jack_j",
            phone_number="555-1013",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 1, 25, 11, 55),
        ),
        User(
            first_name="kate",
            last_name="white",
            email="kate.white@example.com",
            verified_email=True,
            password=hashed_password,
            username="kate_w",
            phone_number="555-1014",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 2, 28, 14, 25),
        ),
        User(
            first_name="mia",
            last_name="martin",
            email="mia.martin@example.com",
            verified_email=True,
            password=hashed_password,
            username="mia_m",
            phone_number="555-1015",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 3, 19, 8, 35),
        ),
        User(
            first_name="noah",
            last_name="garcia",
            email="noah.garcia@example.com",
            verified_email=True,
            password=hashed_password,
            username="noah_g",
            phone_number="555-1016",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime(2024, 4, 30, 17, 5),
        ),
        User(
            first_name="olivia",
            last_name="rodriguez",
            email="olivia.rodriguez@example.com",
            verified_email=True,
            password=hashed_password,
            username="olivia_r",
            phone_number="555-1017",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 5, 18, 13, 15),
        ),
        User(
            first_name="paul",
            last_name="lee",
            email="paul.lee@example.com",
            verified_email=False,
            password=hashed_password,
            username="paul_l",
            phone_number="555-1018",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 6, 25, 10, 50),
        ),
        User(
            first_name="quinn",
            last_name="lewis",
            email="quinn.lewis@example.com",
            verified_email=True,
            password=hashed_password,
            username="quinn_l",
            phone_number="555-1019",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 7, 14, 15, 35),
        ),
        User(
            first_name="rachel",
            last_name="martinez",
            email="rachel.martinez@example.com",
            verified_email=True,
            password=hashed_password,
            username="rachel_m",
            phone_number="555-1020",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 8, 21, 9, 40),
        ),
        User(
            first_name="sam",
            last_name="lopez",
            email="sam.lopez@example.com",
            verified_email=True,
            password=hashed_password,
            username="sam_l",
            phone_number="555-1021",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime(2024, 9, 12, 11, 10),
        ),
        User(
            first_name="tina",
            last_name="hall",
            email="tina.hall@example.com",
            verified_email=True,
            password=hashed_password,
            username="tina_h",
            phone_number="555-1022",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 10, 5, 8, 0),
        ),
        User(
            first_name="ursula",
            last_name="allen",
            email="ursula.allen@example.com",
            verified_email=True,
            password=hashed_password,
            username="ursula_a",
            phone_number="555-1023",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 11, 17, 14, 15),
        ),
        User(
            first_name="victor",
            last_name="young",
            email="victor.young@example.com",
            verified_email=True,
            password=hashed_password,
            username="victor_y",
            phone_number="555-1024",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 12, 9, 16, 50),
        ),
        User(
            first_name="wendy",
            last_name="king",
            email="wendy.king@example.com",
            verified_email=True,
            password=hashed_password,
            username="wendy_k",
            phone_number="555-1025",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 1, 21, 10, 10),
        ),
        User(
            first_name="xavier",
            last_name="wright",
            email="xavier.wright@example.com",
            verified_email=True,
            password=hashed_password,
            username="xavier_w",
            phone_number="555-1026",
            verified_phone_number=True,
            is_active=False,
            is_admin=False,
            created_at=datetime(2024, 2, 14, 9, 30),
        ),
        User(
            first_name="yara",
            last_name="lopez",
            email="yara.lopez@example.com",
            verified_email=True,
            password=hashed_password,
            username="yara_l",
            phone_number="555-1027",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 3, 9, 11, 20),
        ),
        User(
            first_name="zane",
            last_name="morris",
            email="zane.morris@example.com",
            verified_email=True,
            password=hashed_password,
            username="zane_m",
            phone_number="555-1028",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 4, 22, 13, 45),
        ),
        User(
            first_name="amber",
            last_name="nelson",
            email="amber.nelson@example.com",
            verified_email=False,
            password=hashed_password,
            username="amber_n",
            phone_number="555-1029",
            verified_phone_number=False,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 5, 30, 12, 30),
        ),
        User(
            first_name="brad",
            last_name="harris",
            email="brad.harris@example.com",
            verified_email=True,
            password=hashed_password,
            username="brad_h",
            phone_number="555-1030",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
            created_at=datetime(2024, 6, 14, 15, 0),
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
            title="Presidential Election 2026",
            description="National election for president",
            start_date=datetime(2026, 11, 1, 0, 0),
            end_date=datetime(2026, 11, 2, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Presidential Election 2024",
            description="National election for president",
            start_date=datetime(2024, 11, 1, 0, 0),
            end_date=datetime(2024, 11, 2, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="City Council Elections",
            description="Local city council election",
            start_date=datetime(2024, 10, 15, 0, 0),
            end_date=datetime(2024, 10, 16, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="School Board Elections",
            description="School board members election",
            start_date=datetime(2024, 9, 20, 0, 0),
            end_date=datetime(2024, 9, 21, 23, 59, 59),
            creator_id=3,
        ),
        Vote(
            title="Community Center Committee",
            description="Committee election",
            start_date=datetime(2024, 12, 1, 0, 0),
            end_date=datetime(2024, 12, 2, 23, 59, 59),
            creator_id=3,
        ),
        Vote(
            title="Ongoing Election 2026",
            description="Election currently in progress",
            start_date=datetime(2026, 1, 1, 0, 0),
            end_date=datetime(2026, 12, 31, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Future Election 2027",
            description="Planned future election",
            start_date=datetime(2027, 5, 1, 0, 0),
            end_date=datetime(2027, 5, 2, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Past Election 2020",
            description="Completed election in the past",
            start_date=datetime(2020, 6, 1, 0, 0),
            end_date=datetime(2020, 6, 2, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Mayoral Election 2025",
            description="Mayor election",
            start_date=datetime(2025, 3, 15, 0, 0),
            end_date=datetime(2025, 3, 16, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="Regional Assembly 2025",
            description="Regional assembly election",
            start_date=datetime(2025, 4, 10, 0, 0),
            end_date=datetime(2025, 4, 11, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="University Council 2024",
            description="University council election",
            start_date=datetime(2024, 8, 1, 0, 0),
            end_date=datetime(2024, 8, 2, 23, 59, 59),
            creator_id=3,
        ),
        Vote(
            title="Healthcare Board 2024",
            description="Healthcare board election",
            start_date=datetime(2024, 7, 5, 0, 0),
            end_date=datetime(2024, 7, 6, 23, 59, 59),
            creator_id=3,
        ),
        Vote(
            title="Housing Committee 2025",
            description="Housing committee election",
            start_date=datetime(2025, 6, 20, 0, 0),
            end_date=datetime(2025, 6, 21, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="Transport Board 2024",
            description="Transport board election",
            start_date=datetime(2024, 9, 1, 0, 0),
            end_date=datetime(2024, 9, 2, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Education Committee 2026",
            description="Education committee election",
            start_date=datetime(2026, 2, 15, 0, 0),
            end_date=datetime(2026, 2, 16, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="Environment Council 2025",
            description="Environment council election",
            start_date=datetime(2025, 5, 5, 0, 0),
            end_date=datetime(2025, 5, 6, 23, 59, 59),
            creator_id=3,
        ),
        Vote(
            title="Labor Union 2024",
            description="Labor union election",
            start_date=datetime(2024, 11, 10, 0, 0),
            end_date=datetime(2024, 11, 11, 23, 59, 59),
            creator_id=1,
        ),
        Vote(
            title="Tech Board 2026",
            description="Technology board election",
            start_date=datetime(2026, 3, 20, 0, 0),
            end_date=datetime(2026, 3, 21, 23, 59, 59),
            creator_id=2,
        ),
        Vote(
            title="Sports Committee 2025",
            description="Sports committee election",
            start_date=datetime(2025, 7, 15, 0, 0),
            end_date=datetime(2025, 7, 16, 23, 59, 59),
            creator_id=2,
            has_been_counted=False,
        ),
        Vote(
            title="Cultural Council 2024",
            description="Cultural council election",
            start_date=datetime(2024, 12, 5, 0, 0),
            end_date=datetime(2024, 12, 6, 23, 59, 59),
            creator_id=3,
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
            first_name="Nora",
            last_name="Adams",
            photo_url="http://example.com/photos/nora.jpg",
            vote_id=4,
        ),
        Candidate(
            first_name="Oscar",
            last_name="Brown",
            photo_url="http://example.com/photos/oscar.jpg",
            vote_id=5,
        ),
        Candidate(
            first_name="Peter",
            last_name="Clark",
            photo_url="http://example.com/photos/peter.jpg",
            vote_id=7,
        ),
        Candidate(
            first_name="Quincy",
            last_name="Davis",
            photo_url="http://example.com/photos/quincy.jpg",
            vote_id=8,
        ),
        Candidate(
            first_name="Rachel",
            last_name="Evans",
            photo_url="http://example.com/photos/rachel.jpg",
            vote_id=9,
        ),
        Candidate(
            first_name="Sam",
            last_name="Foster",
            photo_url="http://example.com/photos/sam.jpg",
            vote_id=10,
        ),
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
            vote_id=4,
        ),
        Candidate(
            first_name="Hannah",
            last_name="Davis",
            photo_url="http://example.com/photos/hannah.jpg",
            vote_id=4,
        ),
        Candidate(
            first_name="Ian",
            last_name="Clark",
            photo_url="http://example.com/photos/ian.jpg",
            vote_id=5,
        ),
        Candidate(
            first_name="Julia",
            last_name="Roberts",
            photo_url="http://example.com/photos/julia.jpg",
            vote_id=5,
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
            vote_id=7,
        ),
        Candidate(
            first_name="Nina",
            last_name="Simone",
            photo_url="http://example.com/photos/nina.jpg",
            vote_id=7,
        ),
        Candidate(
            first_name="Oscar",
            last_name="Wilde",
            photo_url="http://example.com/photos/oscar.jpg",
            vote_id=8,
        ),
        Candidate(
            first_name="Pam",
            last_name="Beesly",
            photo_url="http://example.com/photos/pam.jpg",
            vote_id=8,
        ),
        Candidate(
            first_name="Quentin",
            last_name="Tarantino",
            photo_url="http://example.com/photos/quentin.jpg",
            vote_id=9,
        ),
        Candidate(
            first_name="Rachel",
            last_name="Green",
            photo_url="http://example.com/photos/rachel.jpg",
            vote_id=9,
        ),
        Candidate(
            first_name="Steve",
            last_name="Jobs",
            photo_url="http://example.com/photos/steve.jpg",
            vote_id=10,
        ),
        Candidate(
            first_name="Tina",
            last_name="Fey",
            photo_url="http://example.com/photos/tina.jpg",
            vote_id=10,
        ),
        Candidate(
            first_name="Uma",
            last_name="Thurman",
            photo_url="http://example.com/photos/uma.jpg",
            vote_id=11,
        ),
        Candidate(
            first_name="Victor",
            last_name="Hugo",
            photo_url="http://example.com/photos/victor.jpg",
            vote_id=11,
        ),
        Candidate(
            first_name="Wendy",
            last_name="Darling",
            photo_url="http://example.com/photos/wendy.jpg",
            vote_id=12,
        ),
        Candidate(
            first_name="Xander",
            last_name="Cage",
            photo_url="http://example.com/photos/xander.jpg",
            vote_id=12,
        ),
        Candidate(
            first_name="Yara",
            last_name="Shahidi",
            photo_url="http://example.com/photos/yara.jpg",
            vote_id=13,
        ),
        Candidate(
            id=60,
            first_name="Zoe",
            last_name="Saldana",
            photo_url="http://example.com/photos/zoe.jpg",
            vote_id=19,
        ),
        Candidate(
            id=61,
            first_name="Aaron",
            last_name="Paul",
            photo_url="http://example.com/photos/aaron.jpg",
            vote_id=19,
        ),
        Candidate(
            id=62,
            first_name="Betty",
            last_name="White",
            photo_url="http://example.com/photos/betty.jpg",
            vote_id=19,
        ),
        Candidate(
            id=63,
            first_name="Carl",
            last_name="Sagan",
            photo_url="http://example.com/photos/carl.jpg",
            vote_id=19,
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
        AttributedVote(user_id=1, vote_id=19),
        AttributedVote(user_id=2, vote_id=19),
        AttributedVote(user_id=3, vote_id=19),
        AttributedVote(user_id=2, vote_id=1),
        AttributedVote(user_id=3, vote_id=1),
        AttributedVote(user_id=4, vote_id=2),
        AttributedVote(user_id=5, vote_id=2),
        AttributedVote(user_id=6, vote_id=3),
        AttributedVote(user_id=7, vote_id=3),
        AttributedVote(user_id=8, vote_id=4),
        AttributedVote(user_id=9, vote_id=4),
        AttributedVote(user_id=10, vote_id=5),
        AttributedVote(user_id=11, vote_id=5),
        AttributedVote(user_id=12, vote_id=6),
        AttributedVote(user_id=13, vote_id=6),
        AttributedVote(user_id=14, vote_id=7),
        AttributedVote(user_id=15, vote_id=7),
        AttributedVote(user_id=16, vote_id=8),
        AttributedVote(user_id=17, vote_id=8),
        AttributedVote(user_id=18, vote_id=9),
        AttributedVote(user_id=19, vote_id=9),
        AttributedVote(user_id=20, vote_id=10),
        AttributedVote(user_id=21, vote_id=10),
        AttributedVote(user_id=22, vote_id=11),
        AttributedVote(user_id=23, vote_id=11),
        AttributedVote(user_id=24, vote_id=12),
        AttributedVote(user_id=25, vote_id=12),
        AttributedVote(user_id=26, vote_id=13),
        AttributedVote(user_id=27, vote_id=13),
        AttributedVote(user_id=28, vote_id=14),
        AttributedVote(user_id=29, vote_id=14),
        AttributedVote(user_id=30, vote_id=15),
        AttributedVote(user_id=1, vote_id=15),
        AttributedVote(user_id=1, vote_id=4),
        AttributedVote(user_id=1, vote_id=5),
        AttributedVote(user_id=2, vote_id=3),
        AttributedVote(user_id=2, vote_id=6),
        AttributedVote(user_id=3, vote_id=4),
        AttributedVote(user_id=3, vote_id=5),
        AttributedVote(user_id=3, vote_id=6),
        AttributedVote(user_id=4, vote_id=1),
        AttributedVote(user_id=4, vote_id=3),
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
            user_id=1, vote_id=19, content=encrypt_string("61"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=2, vote_id=19, content=encrypt_string("60"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=3, vote_id=19, content=encrypt_string("60"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=2, vote_id=3, content=encrypt_string("5"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=3, vote_id=1, content=encrypt_string("6"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=1, vote_id=4, content=encrypt_string("7"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=2, vote_id=5, content=encrypt_string("8"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=3, vote_id=6, content=encrypt_string("9"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=1, vote_id=7, content=encrypt_string("10"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=2, vote_id=8, content=encrypt_string("11"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=3, vote_id=9, content=encrypt_string("12"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=1, vote_id=10, content=encrypt_string("13"), date=datetime.utcnow()
        ),
        Bulletin(
            user_id=2,
            vote_id=1,
            content=encrypt_string("1"),
            date=datetime(2024, 11, 1, 10, 0),
        ),
        Bulletin(
            user_id=4,
            vote_id=2,
            content=encrypt_string("3"),
            date=datetime(2024, 10, 15, 12, 0),
        ),
        Bulletin(
            user_id=5,
            vote_id=2,
            content=encrypt_string("4"),
            date=datetime(2024, 10, 15, 13, 0),
        ),
        Bulletin(
            user_id=6,
            vote_id=3,
            content=encrypt_string("1"),
            date=datetime(2024, 9, 20, 9, 0),
        ),
        Bulletin(
            user_id=7,
            vote_id=3,
            content=encrypt_string("2"),
            date=datetime(2024, 9, 20, 10, 0),
        ),
        Bulletin(
            user_id=8,
            vote_id=4,
            content=encrypt_string("3"),
            date=datetime(2024, 12, 1, 14, 0),
        ),
        Bulletin(
            user_id=9,
            vote_id=4,
            content=encrypt_string("4"),
            date=datetime(2024, 12, 1, 15, 0),
        ),
        Bulletin(
            user_id=10,
            vote_id=5,
            content=encrypt_string("1"),
            date=datetime(2024, 8, 1, 10, 0),
        ),
        Bulletin(
            user_id=11,
            vote_id=5,
            content=encrypt_string("2"),
            date=datetime(2024, 8, 1, 11, 0),
        ),
        Bulletin(
            user_id=12,
            vote_id=6,
            content=encrypt_string("3"),
            date=datetime(2026, 1, 5, 12, 0),
        ),
        Bulletin(
            user_id=13,
            vote_id=6,
            content=encrypt_string("4"),
            date=datetime(2026, 1, 5, 13, 0),
        ),
        Bulletin(
            user_id=14,
            vote_id=7,
            content=encrypt_string("1"),
            date=datetime(2027, 5, 1, 14, 0),
        ),
        Bulletin(
            user_id=15,
            vote_id=7,
            content=encrypt_string("2"),
            date=datetime(2027, 5, 1, 15, 0),
        ),
        Bulletin(
            user_id=16,
            vote_id=8,
            content=encrypt_string("3"),
            date=datetime(2020, 6, 1, 10, 0),
        ),
        Bulletin(
            user_id=17,
            vote_id=8,
            content=encrypt_string("4"),
            date=datetime(2020, 6, 1, 11, 0),
        ),
        Bulletin(
            user_id=18,
            vote_id=9,
            content=encrypt_string("1"),
            date=datetime(2025, 3, 15, 12, 0),
        ),
        Bulletin(
            user_id=19,
            vote_id=9,
            content=encrypt_string("2"),
            date=datetime(2025, 3, 15, 13, 0),
        ),
        Bulletin(
            user_id=20,
            vote_id=10,
            content=encrypt_string("3"),
            date=datetime(2025, 4, 10, 14, 0),
        ),
        Bulletin(
            user_id=21,
            vote_id=10,
            content=encrypt_string("4"),
            date=datetime(2025, 4, 10, 15, 0),
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
