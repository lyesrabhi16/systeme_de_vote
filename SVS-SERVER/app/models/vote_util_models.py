from typing import Any
from sqlmodel import SQLModel
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bulletin import Bulletin
from app.models.user import User
from .vote import Vote, VoteWithCreatorResponseModel
from .candidate import Candidate


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
    async def from_vote_id(vote_id: int, user: "User", db: AsyncSession | None = None):
        if db is None:
            raise ValueError("Database session is None")
        vote = await Vote.get_by_id(vote_id)
        finishedVote: FinishedVoteResponseModel | None = (
            await FinishedVoteResponseModel.from_vote_id(vote_id)
        )
        if finishedVote is None or vote is None:
            return None
        finishedVote.user_has_voted = any(b.vote_id == vote.id for b in user.bulletins)
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
