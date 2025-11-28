from sqlmodel import SQLModel, Field, Relationship


class AttributedVote(SQLModel, table=True):
    user_id: int | None = Field(default=None, primary_key=True, foreign_key="user.id")
    vote_id: int | None = Field(default=None, primary_key=True, foreign_key="vote.id")

    user: "User" = Relationship(back_populates="attributed_votes")
    vote: "Vote" = Relationship(back_populates="attributed_users")
