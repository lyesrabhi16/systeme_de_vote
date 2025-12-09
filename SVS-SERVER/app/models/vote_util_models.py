from sqlmodel import SQLModel
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bulletin import Bulletin
from .vote import FinishedVoteResponseModel, Vote
from .candidate import Candidate


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