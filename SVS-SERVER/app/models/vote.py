import json
from datetime import datetime
from typing import TYPE_CHECKING, Any

from loguru import logger
from phe import PaillierPrivateKey, PaillierPublicKey, paillier
from sqlalchemy import Text, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel

from app.db.db import db_session
from app.models.types import UTCDateTime, utcnow
from app.models.user import User
from app.models.voting_models import VoteCastData
from app.utils import auth_utils

if TYPE_CHECKING:
    from app.models.attributed_votes import AttributedVote
    from app.models.bulletin import Bulletin
    from app.models.candidate import Candidate


class Vote(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(..., title="Titre", max_length=200)
    description: str = Field(..., title="Description", max_length=1000)
    start_date: datetime = Field(..., title="Start Date", sa_type=UTCDateTime)
    end_date: datetime = Field(..., title="End Date", sa_type=UTCDateTime)
    public_key: str = Field(
        ...,
        title="Public Key",
        max_length=10000,
        description="The public key used for vote encryption generated automatically when the vote is created",
        nullable=False,
        index=True,
    )
    encrypted_private_key: str = Field(
        ...,
        title="Encrypted Private Key",
        max_length=20000,
        description="The private key encrypted with the system's master key",
        nullable=False,
    )
    has_been_counted: bool = Field(
        default=False,
        title="Has Been Counted",
        description="Indicates if the vote has been counted",
    )
    encrypted_tally: str | None = Field(
        default=None,
        title="Encrypted Tally",
        sa_type=Text,
        description="For each candidate, the product of the ciphertexts of the valid ballots (JSON): anyone can recompute it from the bulletin board",
    )
    tally_proof: str | None = Field(
        default=None,
        title="Tally Proof",
        sa_type=Text,
        description="For each candidate, the n-th root that proves the encrypted tally decrypts to the published count (JSON): anyone can check it with the public key",
    )
    creator_id: int = Field(..., title="Creator User ID", foreign_key="user.id")

    creator: User = Relationship(
        back_populates="created_votes",
        sa_relationship_kwargs={"lazy": "selectin"},
    )  # async safe

    candidates: list["Candidate"] = Relationship(
        back_populates="vote",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan",
        },  # async safe
    )
    # Not loaded with the election: a ballot weighs several kilobytes and every request that reads an election would carry them all.
    # Query them (or count them) when they are needed; reading this raises.
    bulletins: list["Bulletin"] = Relationship(back_populates="vote", sa_relationship_kwargs={"lazy": "raise"})
    attributed_users: list["AttributedVote"] = Relationship(
        back_populates="vote",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan",
        },  # async safe
    )

    def __init__(self, **data: Any):
        super().__init__(**data)
        if "public_key" not in data or data["public_key"] is None:
            from app.utils import auth_utils, vote_utils

            keys = vote_utils.gen_encryption_key_pair()
            self.public_key = keys["PUBLIC_KEY"]
            self.encrypted_private_key = auth_utils.encrypt_string(keys["PRIVATE_KEY"])

    @db_session
    async def delete(self, db: AsyncSession | None = None) -> None:
        """Delete the vote from the database."""
        if db is None:
            raise ValueError("Database session is None")
        await db.delete(self)
        await db.commit()

    @db_session
    async def register_vote(self, user: User, data: VoteCastData, db: AsyncSession | None = None) -> str:
        """
        Records the ballot of a voter and that they have voted, in one transaction, and answers the receipt (the code of the bulletin).
        The right to vote is taken with a single UPDATE that only succeeds if it has not been taken: two requests of the same voter
        at the same time cannot both get it (the second waits for the first, then finds it taken), where "read the flag, then write it"
        let both through. If anything fails the transaction is rolled back and the voter can try again.
        """
        from app.models.attributed_votes import AttributedVote
        from app.models.bulletin import Bulletin
        from app.utils import auth_utils

        if db is None:
            raise ValueError("Database session is None")
        taken = await db.execute(
            update(AttributedVote)
            .where(
                AttributedVote.user_id == user.id,
                AttributedVote.vote_id == self.id,
                AttributedVote.user_has_voted == False,  # noqa: E712
            )
            .values(user_has_voted=True)
        )
        if taken.rowcount != 1:
            logger.warning(f"User {user.id} has already voted on vote {self.id}, or may not.")
            raise AlreadyVoted("User has already voted on this vote.")
        content = data.model_dump_json()
        # Every ballot is accepted only with proofs the voter could make because they know the randomness of the encryptions, so a ballot
        # cannot be taken from the bulletin board and changed. It could still be sent again as it is, to count twice somebody else's vote.
        copy = await db.execute(
            select(Bulletin.id).where(Bulletin.vote_id == self.id, Bulletin.content == content).limit(1)
        )
        if copy.first() is not None:
            logger.warning(f"A ballot already on vote {self.id} was sent again")
            raise DuplicateBallot("This ballot is already on the bulletin board.")
        bulletin = Bulletin(
            vote_id=self.id,
            content=content,
            date=utcnow(),
            unique_code=auth_utils.generate_unique_code(),
        )
        db.add(bulletin)
        unique_code = bulletin.unique_code
        await db.commit()
        logger.info(f"A ballot was cast on vote {self.id}")  # whose is not logged
        return unique_code

    def has_started(self, now: datetime | None = None) -> bool:
        return self.start_date <= (now or utcnow())

    def is_vote_finished(self, now: datetime | None = None) -> bool:
        """The end is excluded: at the very instant of end_date, it is over."""
        return self.end_date <= (now or utcnow())

    def is_visible_to(self, user: User) -> bool:
        """Who may read an election: the administrators, the person who created it, and the people on its electoral roll."""
        return user.is_admin or self.creator_id == user.id or any(av.user_id == user.id for av in self.attributed_users)

    @staticmethod
    @db_session
    async def get_by_id(vote_id: int, db: AsyncSession | None = None):
        """Retrieve a vote by its ID."""
        if db is None:
            raise ValueError("Database session is None")
        return await db.get(Vote, vote_id)

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified vote to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)

    def get_public_key(self) -> PaillierPublicKey:
        """Return the public key for this vote."""
        data = json.loads(self.public_key)
        public_key = PaillierPublicKey(n=int(data["n"]))
        public_key.g = int(data["g"])  # Set g explicitly if needed
        return public_key

    def get_private_key(self) -> PaillierPrivateKey:
        """Decrypt and return the private key for this vote."""
        decrypted_key_str = auth_utils.decrypt_string(self.encrypted_private_key)
        decrypted_key_data = json.loads(decrypted_key_str)
        return paillier.PaillierPrivateKey(
            public_key=self.get_public_key(),
            p=int(decrypted_key_data["p"]),
            q=int(decrypted_key_data["q"]),
        )


class AlreadyVoted(ValueError):
    """The voter has already voted on this election (or is not on its electoral roll)."""


class DuplicateBallot(ValueError):
    """The same ballot, character for character, is already on the bulletin board."""


class VoteResponseModel(SQLModel):
    """
    An election as the API shows it. The table model must never be a response: it holds the encrypted private key of the election
    (and would hold anything added to the table later).
    """

    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    has_been_counted: bool
    public_key: str
    creator_id: int


class VoteCreatorModel(SQLModel):
    """Who created an election, as the voters see it: a name, never an email address or a phone number."""

    id: int
    first_name: str
    last_name: str
    username: str


class VoteWithCreatorResponseModel(SQLModel):
    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    has_been_counted: bool
    public_key: str
    creator: VoteCreatorModel

    @staticmethod
    @db_session
    async def from_vote_id(
        vote_id: int,
        db: AsyncSession | None = None,
    ):
        if db is None:
            raise ValueError("Database session is None")
        vote = await Vote.get_by_id(vote_id)
        if vote is None:
            return None
        creator = await User.get_user_by_id(vote.creator_id)
        if not vote or not creator or creator.id is None or vote.id is None:
            return None
        return VoteWithCreatorResponseModel(
            id=vote.id,
            title=vote.title,
            description=vote.description,
            start_date=vote.start_date,
            end_date=vote.end_date,
            has_been_counted=vote.has_been_counted,
            public_key=vote.public_key,
            creator=VoteCreatorModel(
                id=creator.id,
                first_name=creator.first_name,
                last_name=creator.last_name,
                username=creator.username,
            ),
        )
