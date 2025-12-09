from sqlmodel import SQLModel


class VoteInputData(SQLModel):
    content: str
