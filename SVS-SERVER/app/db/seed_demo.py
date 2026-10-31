"""
Demo data, to look at the project: accounts, an election that is open, one that is over and counted (with real ballots, so that the
count can be checked: python -m app.utils.audit http://localhost:8000 2), one that has not opened. Run it with

    python -m app.db.seed_demo

It does nothing when there are users already, and asks nothing. (The other seed scripts make random data for the interface; their bulletins
are not valid ballots, so an election made by them is counted as empty.)
"""

import asyncio
from datetime import timedelta

from loguru import logger
from sqlalchemy import func, select, update

from app.db import db_session
from app.db.migrate import adopt_or_upgrade
from app.models import AttributedVote, Candidate, User, Vote
from app.models.types import utcnow
from app.utils import auth_utils, vote_utils
from app.utils.ballot_maker import make_ballot

PASSWORD = "demo-password-123"

ACCOUNTS = [
    # username, first name, last name, admin, authority
    ("registrar", "Régine", "Inscription", True, "Inscription"),
    ("organizer", "Olivier", "Scrutin", True, "Vote"),
    ("alice", "Alice", "Martin", False, None),
    ("bob", "Bob", "Durand", False, None),
    ("carol", "Carole", "Petit", False, None),
    ("dave", "David", "Moreau", False, None),
    ("erin", "Erin", "Lefèvre", False, None),
]


async def make_users() -> dict[str, User]:
    users = {}
    for i, (username, first, last, admin, authority) in enumerate(ACCOUNTS):
        user = User(
            first_name=first,
            last_name=last,
            username=username,
            email=f"{username}@example.org",
            phone_number=f"+3360000{i:04d}",
            password=auth_utils.hash_string(PASSWORD),
            verified_email=True,
            verified_phone_number=True,
            is_admin=admin,
            authority=authority,
        )
        await user.save()
        users[username] = user
    # an account an administrator has just created: no password yet, the first sign-in is by the one-time password alone
    newcomer = User(
        first_name="Nina",
        last_name="Nouvelle",
        username="newcomer",
        email="newcomer@example.org",
        phone_number="+33600009999",
        password=None,
        is_admin=False,
    )
    await newcomer.save()
    users["newcomer"] = newcomer
    return users


@db_session
async def make_election(
    title, description, starts_in, ends_in, creator, voters, candidates, db=None
) -> tuple[int, list[int]]:
    now = utcnow()
    vote = Vote(
        title=title,
        description=description,
        start_date=now + starts_in,
        end_date=now + ends_in,
        creator_id=creator.id,
    )
    db.add(vote)
    await db.flush()
    made = [Candidate(first_name=first, last_name=last, vote_id=vote.id) for first, last in candidates]
    db.add_all(made)
    db.add_all([AttributedVote(user_id=voter.id, vote_id=vote.id) for voter in voters])
    await db.flush()
    ids = vote.id, [c.id for c in made]  # before the commit, which expires what was loaded
    await db.commit()
    return ids


async def cast(vote_id: int, candidate_ids: list[int], user: User, choice: int | None) -> None:
    """What the browser of the voter does, then what the server does with it."""
    vote = await Vote.get_by_id(vote_id)
    ballot = make_ballot(vote_utils.load_public_key(vote.public_key), candidate_ids, choice)
    await asyncio.to_thread(
        vote_utils.check_ballot, vote_utils.load_public_key(vote.public_key), set(candidate_ids), ballot
    )
    await vote.register_vote(user, ballot)


@db_session
async def move_dates(vote_id: int, start, end, db=None) -> None:
    await db.execute(update(Vote).where(Vote.id == vote_id).values(start_date=start, end_date=end))
    await db.commit()


async def seed_demo() -> None:
    await adopt_or_upgrade()

    @db_session
    async def user_count(db=None) -> int:
        return (await db.execute(select(func.count(User.id)))).scalar_one()

    if await user_count():
        logger.info("There is data already: the demo data is not added.")
        return

    users = await make_users()
    organizer = users["organizer"]
    voters = [users[name] for name in ("alice", "bob", "carol", "dave", "erin", "newcomer")]

    # 1. open: alice and bob have voted
    open_id, ids = await make_election(
        "Délégué de la promotion",
        "Élection du délégué pour l'année. Un seul choix, ou un bulletin blanc.",
        timedelta(days=-1),
        timedelta(days=6),
        organizer,
        voters,
        [("Camille", "Roux"), ("Jules", "Fabre"), ("Inès", "Garnier")],
    )
    await cast(open_id, ids, users["alice"], ids[0])
    await cast(open_id, ids, users["bob"], ids[1])

    # 2. over and counted: a real count of real ballots, to audit
    over_id, over_ids = await make_election(
        "Choix du logo",
        "Vote terminé et dépouillé : le résultat peut être vérifié avec le tableau d'affichage.",
        timedelta(days=-9),
        timedelta(days=-2),
        organizer,
        voters,
        [("Logo", "Soleil"), ("Logo", "Montagne")],
    )
    for name, choice in (("alice", over_ids[0]), ("bob", over_ids[0]), ("carol", over_ids[1]), ("dave", None)):
        await cast(over_id, over_ids, users[name], choice)
    await move_dates(over_id, utcnow() - timedelta(days=9), utcnow() - timedelta(days=2))
    await vote_utils.get_vote_count(over_id)

    # 3. not open yet
    await make_election(
        "Budget participatif",
        "Ouvre dans trois jours.",
        timedelta(days=3),
        timedelta(days=10),
        organizer,
        voters,
        [("Projet", "Jardin"), ("Projet", "Bibliothèque"), ("Projet", "Atelier")],
    )

    logger.info("Demo data added.")
    print(f"\nDemo accounts (password: {PASSWORD}):")
    for username, first, last, admin, authority in ACCOUNTS:
        role = f"administrator, {authority} authority" if admin else "voter"
        print(f"  {username:<10} {first} {last}  ({role})")
    print("  newcomer   Nina Nouvelle  (no password yet: signs in with the one-time password alone)")
    print("\nEvery sign-in asks for a one-time password sent by email; with no SMTP_HOST it is written to this log.\n")
    print("Check the count of the finished election from the public data only:")
    print("  python -m app.utils.audit http://localhost:8000 2\n")


if __name__ == "__main__":
    asyncio.run(seed_demo())
