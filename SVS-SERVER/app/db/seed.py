import app.config.env  # Ensure env is loaded
from app.models.user import User
from app.utils.auth_utils import hash_string
from app.db import db_session, init_db, test_db_connection
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

hashed_password = hash_string("0000")


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
        recreate = (
            input(
                "Do you want to recreate the database? This will erase all existing data. (y/n): "
            )
            .strip()
            .lower()
            == "y"
        )
        await setup(recreate=recreate)
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
            ssn="123-45-6789",
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
            ssn="987-65-4321",
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
            ssn="123-45-4289",
            phone_number="555-8765",
            verified_phone_number=True,
            is_active=True,
            is_admin=False,
        ),
    ]

    db.add_all(users)
    await db.commit()
    logger.info(f"Seeded {len(users)} users into the database.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_users())
