from typing import Any
from sqlmodel import SQLModel, select
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bulletin import Bulletin
from app.models.user import User
from app.models.attributed_votes import AttributedVote
from .vote import Vote, VoteWithCreatorResponseModel
from .candidate import Candidate, CandidateCreateModel
from datetime import datetime


class FinishedVoteResponseModel(SQLModel):
    vote: VoteWithCreatorResponseModel
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

        vote_with_creator = await VoteWithCreatorResponseModel.from_vote_id(vote_id)
        if vote_with_creator is None:
            return None

        return FinishedVoteResponseModel(
            vote=vote_with_creator,
            total_bulletins=len(vote.bulletins),
            candidate_results={
                candidate.id: candidate.vote_count for candidate in vote.candidates
            },
            abstention_count=(
                len({u.user_id for u in vote.attributed_users})
                - len({bulletin.user_id for bulletin in vote.bulletins})
            ),
            voter_count=len({bulletin.user_id for bulletin in vote.bulletins}),
            user_has_voted=(
                user.id in {bulletin.user_id for bulletin in vote.bulletins}
                if user
                else False
            ),
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
            await FinishedVoteResponseModel.from_vote_id(vote_id)
        )
        if finishedVote is None or vote is None:
            return None
        finishedVote.user_has_voted = (
            any(b.vote_id == vote.id for b in user.bulletins) if user else False
        )
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

        if final_user_ids:
            db.add_all(
                [AttributedVote(user_id=id, vote_id=vote.id) for id in final_user_ids]
            )
        await db.commit()
        await db.refresh(vote)

        return await FullVoteResponseModel.from_vote_id(vote.id)
