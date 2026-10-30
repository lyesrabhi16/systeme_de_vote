"""What the tests share: people and signed-in requests. (The environment is set by conftest.py, which pytest loads first.)"""

from datetime import datetime, timedelta

from app.db import db_session
from app.models import AttributedVote, Candidate, User, Vote
from app.models.auth_models import JWT_DATA
from app.utils import auth_utils

PASSWORD = "correct horse battery"

_phone = iter(range(10_000_000, 99_999_999))


async def make_user(
    username: str,
    admin: bool = False,
    active: bool = True,
    password: str | None = PASSWORD,
    authority: str | None = None,
) -> User:
    """A user. Without a password (None) it is an account that has not signed in yet."""
    user = User(
        first_name=username.capitalize(),
        last_name="Test",
        username=username,
        email=f"{username}@example.com",
        phone_number=f"+33{next(_phone)}",
        password=auth_utils.hash_string(password) if password else None,
        verified_email=True,
        verified_phone_number=True,
        is_active=active,
        is_admin=admin,
        authority=authority,
    )
    await user.save()
    return user


def bearer(user: User) -> dict[str, str]:
    """The header of a request made by this user (already signed in)."""
    assert user.id is not None
    return {"Authorization": f"Bearer {auth_utils.generate_token(JWT_DATA(id=user.id))}"}


async def make_vote(
    creator: User,
    voters: list[User],
    candidates: int = 2,
    starts_in: timedelta = timedelta(days=-1),
    ends_in: timedelta = timedelta(days=1),
    title: str = "An election",
) -> tuple[Vote, list[Candidate]]:
    """An election with its candidates and its electoral roll (and its own keys, as in production). By default it is open."""
    now = datetime.utcnow()
    vote = Vote(title=title, description="", start_date=now + starts_in, end_date=now + ends_in, creator_id=creator.id)
    await vote.save()
    made = []
    for i in range(candidates):
        candidate = Candidate(first_name=f"Candidate{i}", last_name="X", vote_id=vote.id)
        await candidate.save()
        made.append(candidate)

    @db_session
    async def enrol(db=None):
        db.add_all(AttributedVote(user_id=v.id, vote_id=vote.id) for v in voters)
        await db.commit()

    await enrol()
    return vote, made
