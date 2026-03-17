from typing import Any
from sqlmodel import SQLModel, select, delete
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bulletin import Bulletin
from app.models.user import User
from app.models.attributed_votes import AttributedVote
from app.utils import auth_utils
from .vote import Vote, VoteWithCreatorResponseModel
from .candidate import Candidate, CandidateCreateModel
from datetime import datetime
from loguru import logger


class FinishedVoteResponseModel(SQLModel):
    vote: VoteWithCreatorResponseModel
    tally_proof: str | None = None
    encrypted_tally: str | None = None
    total_bulletins: int
    candidate_results: dict[int, int]  # candidate_id -> number of votes
    abstention_count: int
    voter_count: int
    user_has_voted: bool
    winner_candidates: list[int] | None = None
    candidates: list[Candidate] | None = None

    def __hash__(self) -> int:
        return self.vote.id

    def __init__(self, **data: Any):
        super().__init__(**data)
        self.winner_candidates = self.__winner_candidates()

    def __winner_candidates(self) -> list[int]:
        max_votes = max(self.candidate_results.values(), default=0)
        return [
            candidate_id
            for candidate_id, votes in self.candidate_results.items()
            if votes == max_votes and max_votes > 0
        ]

    @staticmethod
    @db_session
    async def from_vote_id(
        vote_id: int,
        user: User | None = None,
        db: AsyncSession | None = None,
    ):
        if db is None:
            raise ValueError("Database session is None")

        vote = await Vote.get_by_id(vote_id)
        if vote is None:
            return None

        user_av = (
            await AttributedVote.get_by_ids(user_id=user.id, vote_id=vote_id)
            if user
            else None
        )

        vote_with_creator = await VoteWithCreatorResponseModel.from_vote_id(vote_id)
        if vote_with_creator is None:
            return None

        return FinishedVoteResponseModel(
            vote=vote_with_creator,
            total_bulletins=len(vote.bulletins),
            encrypted_tally=vote.encrypted_tally,
            tally_proof=vote.tally_proof,
            candidate_results={
                candidate.id: candidate.vote_count for candidate in vote.candidates
            },
            abstention_count=(
                len(
                    {
                        av.user_id
                        for av in vote.attributed_users
                        if not av.user_has_voted
                    }
                )
            ),
            voter_count=len(
                {av.user_id for av in vote.attributed_users if av.user_has_voted}
            ),
            user_has_voted=(user_av.user_has_voted if user_av else False),
            candidates=vote.candidates,
        )


class FullVoteResponseModel(SQLModel):
    vote: FinishedVoteResponseModel
    candidates: list[Candidate]
    total_bulletins: int

    @staticmethod
    @db_session
    async def from_vote_id(
        vote_id: int, user: User | None = None, db: AsyncSession | None = None
    ):
        if db is None:
            raise ValueError("Database session is None")
        vote = await Vote.get_by_id(vote_id)
        finishedVote: FinishedVoteResponseModel | None = (
            await FinishedVoteResponseModel.from_vote_id(vote_id, user)
        )
        if finishedVote is None or vote is None:
            return None
        return FullVoteResponseModel(
            vote=finishedVote,
            candidates=vote.candidates,
            total_bulletins=len(vote.bulletins),
        )


class VoteResultsModel(SQLModel):
    candidate_results: dict[int, int]  # candidate_id -> number of votes
    count_failures: list[Bulletin]
    abstention_count: int
    voter_count: int


class VoteCreationModel(SQLModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    candidates: list[CandidateCreateModel]
    open_to_all: bool = False
    attributed_user_ids: list[int] | None = None
    excluded_user_ids: list[int] | None = None

    @db_session
    async def save(
        self, creator_id: int, db: AsyncSession | None = None
    ) -> FullVoteResponseModel | None:
        if db is None:
            raise ValueError("Database session is None")

        vote = Vote(
            title=self.title,
            description=self.description,
            start_date=self.start_date.replace(tzinfo=None),
            end_date=self.end_date.replace(tzinfo=None),
            creator_id=creator_id,
        )
        db.add(vote)
        await db.flush()  # get vote.id safely

        # Candidates
        for c in self.candidates:
            db.add(
                Candidate(
                    first_name=c.first_name,
                    last_name=c.last_name,
                    photo_url=c.photo_url,
                    vote_id=vote.id,
                )
            )

        # Resolve attributed users
        attributed_ids = set(self.attributed_user_ids or [])

        if self.open_to_all:
            result = await db.execute(select(User.id))
            attributed_ids = {row[0] for row in result.fetchall()}

        excluded_ids = set(self.excluded_user_ids or [])
        final_user_ids = attributed_ids - excluded_ids
        logger.info(
            f"Vote {vote.id} attributed to users: {final_user_ids} (excluded: {excluded_ids})"
        )
        if final_user_ids:
            db.add_all(
                [AttributedVote(user_id=_id, vote_id=vote.id) for _id in final_user_ids]
            )
        await db.commit()
        await db.refresh(vote)

        return await FullVoteResponseModel.from_vote_id(vote.id)


class VoteUpdateModel(SQLModel):
    title: str | None = None
    description: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    candidates: list[CandidateCreateModel] | None = None
    public_key: str | None = None
    private_key: str | None = None
    open_to_all: bool | None = None
    attributed_user_ids: list[int] | None = None
    excluded_user_ids: list[int] | None = None

    @db_session
    async def update(
        self, vote_id: int, db: AsyncSession | None = None
    ) -> FullVoteResponseModel | None:
        logger.debug(f"Updating vote {vote_id} with data: {self.json()}")
        if db is None:
            raise ValueError("Database session is None")
        vote = await Vote.get_by_id(vote_id)
        if vote is None:
            return None
        logger.debug(f"Updating vote {vote_id} with data: {self.json()}")

        if self.title is not None:
            vote.title = self.title
        if self.description is not None:
            vote.description = self.description
        if self.start_date is not None:
            vote.start_date = self.start_date.replace(tzinfo=None)
        if self.end_date is not None:
            vote.end_date = self.end_date.replace(tzinfo=None)
            vote.has_been_counted = False  # reset counting status if end date changes
        if self.public_key is not None:
            vote.public_key = self.public_key
        if self.private_key is not None:
            vote.encrypted_private_key = auth_utils.encrypt_string(self.private_key)
        if self.candidates is not None:
            # Delete existing candidates
            await db.execute(delete(Candidate).where(Candidate.vote_id == vote_id))
            # Add new candidates
            for c in self.candidates:
                db.add(
                    Candidate(
                        first_name=c.first_name,
                        last_name=c.last_name,
                        photo_url=c.photo_url,
                        vote_id=vote.id,
                    )
                )
        # Update attributed users if needed
        if self.open_to_all is not None or self.attributed_user_ids is not None:
            if self.open_to_all:
                result = await db.execute(select(User.id))
                new_attributed_ids = {row[0] for row in result.fetchall()}
            else:
                new_attributed_ids = set(self.attributed_user_ids or [])
            if self.excluded_user_ids is not None:
                new_attributed_ids -= set(self.excluded_user_ids)
            # Get current attributed user ids
            result = await db.execute(
                select(AttributedVote.user_id).where(AttributedVote.vote_id == vote_id)
            )
            current_attributed_ids = {row[0] for row in result.fetchall()}
            # Calculate ids to add and remove
            to_add = new_attributed_ids - current_attributed_ids
            to_remove = current_attributed_ids - new_attributed_ids
            # Add new attributed votes
            db.add_all([AttributedVote(user_id=_id, vote_id=vote.id) for _id in to_add])
            # Remove old attributed votes
            if to_remove:
                await db.execute(
                    delete(AttributedVote).where(
                        AttributedVote.vote_id == vote_id,
                        AttributedVote.user_id.in_(to_remove),
                    )
                )
        logger.debug(f"Committing updates for vote {vote_id}, vote data: {vote.json()}")
        await vote.save()
        await db.commit()
        return await FullVoteResponseModel.from_vote_id(vote.id)
