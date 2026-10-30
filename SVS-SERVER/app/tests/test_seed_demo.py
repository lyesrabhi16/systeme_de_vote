"""The demo data: it must work on a database (it is what the demo compose file starts with), and be real."""

from sqlalchemy import func, select

from app.db import db_session
from app.db.seed_demo import PASSWORD, seed_demo
from app.models import Bulletin, User, Vote
from app.utils.audit import audit_election


@db_session
async def read(db=None):
    users = (await db.execute(select(func.count(User.id)))).scalar_one()
    votes = (await db.execute(select(Vote).order_by(Vote.id))).scalars().all()
    bulletins = (await db.execute(select(func.count(Bulletin.id)))).scalar_one()
    return users, votes, bulletins


async def test_the_demo_data_has_an_open_a_counted_and_an_upcoming_election():
    await seed_demo()
    users, votes, bulletins = await read()
    assert users == 8
    assert [v.title for v in votes] == ["Délégué de la promotion", "Choix du logo", "Budget participatif"]
    assert [v.has_been_counted for v in votes] == [False, True, False]
    assert bulletins == 2 + 4


async def test_it_does_nothing_when_there_is_data_already():
    await seed_demo()
    before = await read()
    await seed_demo()
    assert (await read())[0] == before[0] and (await read())[2] == before[2]


async def test_the_counted_election_can_be_checked_by_anybody(client):
    await seed_demo()
    _, votes, _ = await read()
    counted = votes[1]
    published = (await client.get(f"/api/vote/audit/{counted.id}/")).json()
    board = (await client.get(f"/api/vote/bulletins/{counted.id}/?items_per_page=100")).json()["data"]
    report = audit_election(
        published["public_key"],
        {int(k) for k in published["counts"]},
        [(b["id"], b["content"]) for b in board],
        {int(k): v for k, v in published["counts"].items()},
        {int(k): int(v) for k, v in published["encrypted_tally"].items()},
        {int(k): int(v) for k, v in published["tally_proof"].items()},
    )
    assert report.ok, report.problems
    assert sorted(report.counts.values()) == [1, 2]  # alice and bob for the first, carol for the second, dave blank


async def test_the_demo_accounts_can_sign_in(client, outbox):
    await seed_demo()
    login = await client.post(
        "/api/auth/login", json={"identifier": "alice", "password": PASSWORD, "identifier_type": "username"}
    )
    assert login.status_code == 200
    first = await client.post("/api/auth/login", json={"identifier": "newcomer", "identifier_type": "username"})
    assert first.status_code == 200 and first.json()["first_login"] is True
