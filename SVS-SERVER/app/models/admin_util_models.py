from pydantic import BaseModel

from app.models.vote_util_models import (
    FullVoteResponseModel,
    VoteWithCreatorResponseModel,
)


class ParticipationDataResponseModel(BaseModel):
    total_votes: int
    total_abstain: int
    no_participation: int


class VoteStatusPerMonthResponseModel(BaseModel):
    month: str
    upcoming: int
    ongoing: int
    finished: int


class UserGrowthPerMonthResponseModel(BaseModel):
    month: str
    new_users_count: int
    total_users: int


class VotesPerMonthResponseModel(BaseModel):
    month: str
    vote_count: int


class DashboardResponseModel(BaseModel):
    lastFinishedVote: FullVoteResponseModel | None = None
    upcomingVotes: list[VoteWithCreatorResponseModel] | None = None
    ongoingVotes: list[VoteWithCreatorResponseModel] | None = None
    participationData: ParticipationDataResponseModel | None = None
    votesPerMonth: list[VotesPerMonthResponseModel] | None = None
    votesStatusPerMonth: list[VoteStatusPerMonthResponseModel] | None = None
    userGrowthPerMonth: list[UserGrowthPerMonthResponseModel] | None = None
    userRoleRepartition: dict[str, int] | None = None
    userActivityRepartition: dict[str, int] | None = None
    nbr_users: int | None = None
    nbr_admins: int | None = None
    nbr_inscription_authority: int | None = None
    nbr_vote_authority: int | None = None
