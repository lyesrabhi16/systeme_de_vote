"""What the tests share: people and signed-in requests. (The environment is set by conftest.py, which pytest loads first.)"""

from app.models import User
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
