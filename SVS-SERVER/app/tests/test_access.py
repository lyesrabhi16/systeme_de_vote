"""Who can see what, who can change the candidates, the lists of elections, the web client and the API side by side, CORS, dates, headers."""

import json
from datetime import UTC, datetime, timedelta, timezone

import pytest
from ballots import make_ballot
from helpers import bearer, make_user, make_vote
from sqlalchemy import select

from app.db import db_session
from app.models import Candidate, Vote
from app.models.types import utcnow
from app.utils import vote_utils


async def cast(client, user, vote, candidate_ids, choice):
    data = make_ballot(vote_utils.load_public_key(vote.public_key), candidate_ids, choice)
    return await client.post(f"/api/vote/cast/{vote.id}", headers=bearer(user), json=data.model_dump())


class TestWhoCanSeeAnElection:
    async def setup_election(self):
        admin = await make_user("admin", admin=True, authority="Vote")
        creator = await make_user("creator", admin=True, authority="Vote")
        ada, eve = await make_user("ada"), await make_user("eve")
        vote, candidates = await make_vote(creator, [ada])
        return admin, creator, ada, eve, vote, candidates

    @pytest.mark.parametrize("path", ["/api/vote/{id}/", "/api/vote/result/{id}/"])
    async def test_somebody_who_is_not_concerned_cannot_read_it(self, client, path):
        _, _, _, eve, vote, _ = await self.setup_election()
        response = await client.get(path.format(id=vote.id), headers=bearer(eve))
        assert response.status_code == 403

    @pytest.mark.parametrize("path", ["/api/vote/{id}/", "/api/vote/result/{id}/"])
    @pytest.mark.parametrize("who", ["ada", "creator", "admin"])
    async def test_the_roll_the_creator_and_the_administrators_can(self, client, path, who):
        """The administrators used to be refused the result of an election they were not enrolled in."""
        admin, creator, ada, _, vote, _ = await self.setup_election()
        user = {"ada": ada, "creator": creator, "admin": admin}[who]
        response = await client.get(path.format(id=vote.id), headers=bearer(user))
        assert response.status_code == 200

    async def test_an_election_that_does_not_exist_is_not_found(self, client):
        ada = await make_user("ada")
        for path in ("/api/vote/999/", "/api/vote/result/999/"):
            assert (await client.get(path, headers=bearer(ada))).status_code == 404

    @pytest.mark.parametrize(
        "path",
        [
            "/api/vote/",
            "/api/vote/available",
            "/api/vote/voted",
            "/api/vote/created",
            "/api/vote/attributed",
            "/api/vote/finishedVotes",
            "/api/vote/1/",
            "/api/vote/result/1/",
            "/api/vote/count/1/",
            "/api/users/",
            "/api/users/1",
            "/api/candidates/?id=1",
            "/api/admin/",
        ],
    )
    async def test_everything_needs_a_signed_in_user(self, client, path):
        assert (await client.get(path)).status_code == 401

    async def test_the_creator_is_shown_by_name_and_never_by_address_or_phone_number(self, client):
        _, creator, ada, _, vote, _ = await self.setup_election()
        body = (await client.get(f"/api/vote/{vote.id}/", headers=bearer(ada))).json()
        assert set(body["vote"]["vote"]["creator"]) == {"id", "first_name", "last_name", "username"}
        assert creator.email not in json.dumps(body)
        assert creator.phone_number not in json.dumps(body)

    async def test_the_bulletin_board_and_the_audit_are_public_by_design(self, client):
        _, _, _, _, vote, _ = await self.setup_election()
        assert (await client.get(f"/api/vote/bulletins/{vote.id}/")).status_code == 200
        assert (await client.get(f"/api/bulletins/?vote_id={vote.id}")).status_code == 200


class TestTheCandidatesAreFixedWhenTheElectionOpens:
    """A ballot has an entry for each candidate: changing them while people vote would invalidate the ballots already cast."""

    async def test_a_vote_authority_edits_them_before_the_opening(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        vote, (first, _) = await make_vote(admin, [], starts_in=timedelta(days=1), ends_in=timedelta(days=2))
        headers = bearer(admin)
        created = await client.post(
            "/api/candidates/", headers=headers, json={"first_name": "New", "last_name": "One", "vote_id": vote.id}
        )
        assert created.status_code == 200, created.text
        renamed = await client.put(
            f"/api/candidates/?id={first.id}", headers=headers, json={"first_name": "Renamed", "last_name": "X"}
        )
        assert renamed.status_code == 200 and renamed.json()["first_name"] == "Renamed"
        assert (await client.delete(f"/api/candidates/?id={created.json()['id']}", headers=headers)).status_code == 200

    async def test_nobody_edits_them_once_it_is_open(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        vote, (first, second) = await make_vote(admin, [])  # open
        headers = bearer(admin)
        refused = [
            await client.post(
                "/api/candidates/", headers=headers, json={"first_name": "Late", "last_name": "X", "vote_id": vote.id}
            ),
            await client.put(
                f"/api/candidates/?id={first.id}", headers=headers, json={"first_name": "A", "last_name": "B"}
            ),
            await client.delete(f"/api/candidates/?id={first.id}", headers=headers),
        ]
        assert [r.status_code for r in refused] == [400, 400, 400]

        @db_session
        async def count(db=None):
            return len((await db.execute(select(Candidate).where(Candidate.vote_id == vote.id))).scalars().all())

        assert await count() == 2

    async def test_only_the_vote_authority_edits_them(self, client):
        registrar = await make_user("registrar", admin=True, authority="Inscription")
        ada = await make_user("ada")
        author = await make_user("author", admin=True, authority="Vote")
        vote, (first, _) = await make_vote(author, [ada], starts_in=timedelta(days=1), ends_in=timedelta(days=2))
        for user in (registrar, ada):
            response = await client.delete(f"/api/candidates/?id={first.id}", headers=bearer(user))
            assert response.status_code == 403

    async def test_a_candidate_of_somebody_else_s_election_is_not_shown(self, client):
        author = await make_user("author", admin=True, authority="Vote")
        eve = await make_user("eve")
        _, (first, _) = await make_vote(author, [])
        assert (await client.get(f"/api/candidates/?id={first.id}", headers=bearer(eve))).status_code == 404
        assert (await client.get(f"/api/candidates/?id={first.id}", headers=bearer(author))).status_code == 200


class TestTheLists:
    async def test_the_lists_follow_what_the_user_did_and_can_do(self, client):
        admin, ada = await make_user("admin", admin=True, authority="Vote"), await make_user("ada")
        open_vote, open_candidates = await make_vote(admin, [ada], title="open")
        await make_vote(admin, [ada], starts_in=timedelta(days=2), ends_in=timedelta(days=3), title="upcoming")
        await make_vote(admin, [ada], starts_in=timedelta(days=-3), ends_in=timedelta(days=-1), title="over")
        await make_vote(admin, [], title="not for her")
        headers = bearer(ada)

        titles = lambda r: sorted(v["title"] for v in r.json())  # noqa: E731
        assert titles(await client.get("/api/vote/attributed", headers=headers)) == ["open", "over", "upcoming"]
        assert titles(await client.get("/api/vote/available", headers=headers)) == ["open", "upcoming"]
        assert titles(await client.get("/api/vote/voted", headers=headers)) == []
        assert titles(await client.get("/api/vote/created", headers=headers)) == []

        ids = [c.id for c in open_candidates]
        assert (await cast(client, ada, open_vote, ids, ids[0])).status_code == 200
        assert titles(await client.get("/api/vote/available", headers=headers)) == ["upcoming"]
        assert titles(await client.get("/api/vote/voted", headers=headers)) == ["open"]
        assert titles(await client.get("/api/vote/created", headers=bearer(admin))) == [
            "not for her",
            "open",
            "over",
            "upcoming",
        ]

    async def test_finished_votes_are_the_ones_that_are_over_and_the_ones_voted_in(self, client):
        admin, ada = await make_user("admin", admin=True, authority="Vote"), await make_user("ada")
        open_vote, open_candidates = await make_vote(admin, [ada], title="open")
        await make_vote(admin, [ada], starts_in=timedelta(days=-3), ends_in=timedelta(days=-1), title="over")
        await make_vote(admin, [ada], starts_in=timedelta(days=2), ends_in=timedelta(days=3), title="upcoming")
        before = (await client.get("/api/vote/finishedVotes", headers=bearer(ada))).json()
        assert [v["vote"]["title"] for v in before] == ["over"] and not before[0]["user_has_voted"]
        ids = [c.id for c in open_candidates]
        await cast(client, ada, open_vote, ids, ids[0])
        after = (await client.get("/api/vote/finishedVotes", headers=bearer(ada))).json()
        assert sorted(v["vote"]["title"] for v in after) == ["open", "over"]
        assert {v["vote"]["title"]: v["user_has_voted"] for v in after} == {"open": True, "over": False}

    async def test_the_list_of_elections_is_paged_searched_and_has_each_election_once(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        ada = await make_user("ada")
        for i in range(5):
            await make_vote(admin, [ada], title=f"Election {i}")
        await make_vote(admin, [ada], title="Budget")
        # ada is on every roll; the administrator created them all and is on none: nothing is listed twice
        body = (await client.get("/api/vote/?per_page=4", headers=bearer(ada))).json()
        assert body["total_count"] == 6 and len(body["data"]) == 4
        second = (await client.get("/api/vote/?per_page=4&page=2", headers=bearer(ada))).json()
        assert len(second["data"]) == 2
        assert {v["id"] for v in body["data"]}.isdisjoint({v["id"] for v in second["data"]})
        found = (await client.get("/api/vote/?search=budget", headers=bearer(ada))).json()
        assert [v["title"] for v in found["data"]] == ["Budget"]
        assert "encrypted_private_key" not in json.dumps(body)

    async def test_the_list_of_an_administrator_is_all_of_them(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        for i in range(3):
            await make_vote(admin, [], title=f"E{i}")
        body = (await client.get("/api/vote/", headers=bearer(admin))).json()
        assert body["total_count"] == 3

    async def test_paging_stays_within_bounds(self, client):
        ada = await make_user("ada")
        for query in ("per_page=0", "per_page=1000", "page=0"):
            assert (await client.get(f"/api/vote/?{query}", headers=bearer(ada))).status_code == 422


class TestTheWebClientAndTheApi:
    @pytest.fixture
    def page(self, tmp_path, monkeypatch):
        (tmp_path / "index.html").write_text("<html>the app</html>")
        monkeypatch.setattr("app.main.DIST_DIR", str(tmp_path))

    @pytest.mark.parametrize(
        "path",
        [
            "/",
            "/login",
            "/login/verify-otp/abc123",
            "/reset-password",
            "/vote/12",
            "/vote/12/",
            "/admin/votes",
            "/some/deep/route",
        ],
    )
    async def test_every_route_of_the_web_client_gets_the_page_even_when_it_is_reloaded(self, client, page, path):
        """/vote/12 is the page of an election, /api/vote/12/ is its data: reloading the page used to answer with the JSON of the API."""
        response = await client.get(path)
        assert response.status_code == 200
        assert "the app" in response.text
        assert "text/html" in response.headers["content-type"]

    @pytest.mark.parametrize("path", ["/api/auth/nope", "/api/vote/nope/nope", "/api/", "/api/nothing"])
    async def test_a_path_of_the_api_that_does_not_exist_is_a_404_not_the_page(self, client, page, path):
        response = await client.get(path)
        assert response.status_code == 404, path
        assert "the app" not in response.text

    async def test_the_old_paths_without_the_prefix_are_the_page_now(self, client, page):
        """The API moved under /api: /vote/12 is a route of the client, whatever it used to be."""
        assert "the app" in (await client.get("/vote/12")).text

    async def test_without_the_client_built_the_api_still_answers(self, client, tmp_path, monkeypatch):
        monkeypatch.setattr("app.main.DIST_DIR", str(tmp_path / "nothing"))
        assert (await client.get("/login")).status_code == 404
        assert (await client.get("/api/vote/")).status_code == 401

    async def test_the_documentation_is_served(self, client):
        assert (await client.get("/docs")).status_code == 200
        assert (await client.get("/openapi.json")).status_code == 200


class TestCors:
    async def test_the_listed_origin_may_send_its_cookies(self, client):
        response = await client.get("/api/vote/", headers={"Origin": "http://localhost:3000"})
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert response.headers["access-control-allow-credentials"] == "true"

    async def test_another_origin_gets_nothing(self, client):
        response = await client.get("/api/vote/", headers={"Origin": "https://evil.example"})
        assert "access-control-allow-origin" not in response.headers


class TestDates:
    async def test_a_date_with_a_timezone_goes_in_as_utc_and_comes_out_with_its_timezone(self):
        paris = timezone(timedelta(hours=2))
        admin = await make_user("admin", admin=True, authority="Vote")
        vote = Vote(
            title="t",
            description="",
            start_date=datetime(2030, 1, 1, 12, 0, tzinfo=paris),
            end_date=datetime(2030, 1, 2, 12, 0, tzinfo=paris),
            creator_id=admin.id,
        )
        await vote.save()

        @db_session
        async def read(db=None):
            return (await db.execute(select(Vote).where(Vote.id == vote.id))).scalar_one()

        stored = await read()
        assert stored.start_date == datetime(2030, 1, 1, 10, 0, tzinfo=UTC)  # 12:00 in Paris is 10:00 UTC
        assert stored.start_date.tzinfo == UTC

    async def test_a_request_that_says_plus_two_is_not_read_as_utc(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        response = await client.post(
            "/api/vote/",
            headers=bearer(admin),
            json={
                "title": "t",
                "description": "",
                "start_date": "2099-01-01T12:00:00+02:00",
                "end_date": "2099-01-02T12:00:00+02:00",
                "candidates": [{"first_name": "A", "last_name": "B"}],
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["vote"]["vote"]["start_date"].startswith("2099-01-01T10:00:00")

    async def test_the_api_says_the_dates_are_utc(self, client):
        admin, ada = await make_user("admin", admin=True, authority="Vote"), await make_user("ada")
        await make_vote(admin, [ada])
        body = (await client.get("/api/vote/attributed", headers=bearer(ada))).json()
        assert body[0]["start_date"].endswith("Z")
        assert body[0]["end_date"].endswith("Z")

    async def test_an_election_has_started_and_is_over_at_the_right_moments(self):
        now = utcnow()
        vote = Vote(title="t", description="", start_date=now, end_date=now + timedelta(hours=1), creator_id=1)
        assert vote.has_started(now) and not vote.is_vote_finished(now)
        assert not vote.has_started(now - timedelta(microseconds=1))
        assert vote.is_vote_finished(vote.end_date)  # the end is excluded

    async def test_an_election_must_end_after_it_starts_and_have_a_candidate(self, client):
        admin = await make_user("admin", admin=True, authority="Vote")
        base = {"title": "t", "description": "", "candidates": [{"first_name": "A", "last_name": "B"}]}
        backwards = {**base, "start_date": "2099-01-02T00:00:00Z", "end_date": "2099-01-01T00:00:00Z"}
        empty = {**base, "candidates": [], "start_date": "2099-01-01T00:00:00Z", "end_date": "2099-01-02T00:00:00Z"}
        for body in (backwards, empty):
            assert (await client.post("/api/vote/", headers=bearer(admin), json=body)).status_code == 422


class TestHeaders:
    async def test_every_answer_tells_the_browser_not_to_guess_nor_to_frame_nor_to_keep_it(self, client):
        response = await client.get("/api/vote/")  # an error answer is covered too
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"
        assert response.headers["referrer-policy"] == "no-referrer"
        assert response.headers["cache-control"] == "no-store"
        assert "camera=()" in response.headers["permissions-policy"]

    async def test_the_documentation_may_be_cached_but_not_framed(self, client):
        response = await client.get("/docs")
        assert "cache-control" not in response.headers
        assert response.headers["x-frame-options"] == "DENY"

    async def test_https_is_asked_for_only_in_production(self, client):
        assert (
            "strict-transport-security" not in (await client.get("/api/vote/")).headers
        )  # testing mode: plain http is fine


class TestTheElectoralRoll:
    """Who may vote: for the vote authority to read and to change, and a change of something else must not touch it."""

    async def setup_election(self, voters=3):
        author = await make_user("author", admin=True, authority="Vote")
        people = [await make_user(f"voter{i}") for i in range(voters)]
        vote, candidates = await make_vote(author, people, starts_in=timedelta(days=1), ends_in=timedelta(days=2))
        return author, people, vote, candidates

    async def test_the_vote_authority_reads_it_paged_and_searched_and_it_has_no_secret(self, client):
        author, people, vote, _ = await self.setup_election(voters=5)
        first = (await client.get(f"/api/vote/{vote.id}/roll/?per_page=2", headers=bearer(author))).json()
        assert first["total_count"] == 5 and len(first["data"]) == 2
        second = (await client.get(f"/api/vote/{vote.id}/roll/?per_page=2&page=3", headers=bearer(author))).json()
        assert len(second["data"]) == 1
        found = (await client.get(f"/api/vote/{vote.id}/roll/?search=voter3", headers=bearer(author))).json()
        assert [u["username"] for u in found["data"]] == ["voter3"] and found["total_count"] == 1
        assert "password" not in str(first)

    async def test_nobody_else_reads_it(self, client):
        author, people, vote, _ = await self.setup_election()
        registrar = await make_user("registrar", admin=True, authority="Inscription")
        for user in (people[0], registrar):
            assert (await client.get(f"/api/vote/{vote.id}/roll/", headers=bearer(user))).status_code == 403
        assert (await client.get(f"/api/vote/{vote.id}/roll/")).status_code == 401
        assert (await client.get("/api/vote/9999/roll/", headers=bearer(author))).status_code == 404

    async def test_an_election_only_on_the_roll_of_its_own_people(self, client):
        author, people, vote, _ = await self.setup_election(voters=2)
        other, _ = await make_vote(author, [await make_user("elsewhere")], title="Other")
        usernames = [
            u["username"]
            for u in (await client.get(f"/api/vote/{vote.id}/roll/", headers=bearer(author))).json()["data"]
        ]
        assert sorted(usernames) == ["voter0", "voter1"]

    async def test_changing_the_title_leaves_the_roll_alone(self, client):
        """The editor used to send "open to all" with every save: renaming an election enrolled everybody in it."""
        author, people, vote, _ = await self.setup_election(voters=2)
        await make_user("bystander")  # an account that is not on the roll
        response = await client.put(f"/api/vote/{vote.id}/", headers=bearer(author), json={"title": "Renamed"})
        assert response.status_code == 200, response.text
        roll = (await client.get(f"/api/vote/{vote.id}/roll/", headers=bearer(author))).json()
        assert roll["total_count"] == 2

    async def test_the_roll_is_replaced_when_a_list_is_sent(self, client):
        author, people, vote, _ = await self.setup_election(voters=3)
        keep = [people[0].id, people[1].id]
        response = await client.put(
            f"/api/vote/{vote.id}/", headers=bearer(author), json={"attributed_user_ids": keep, "open_to_all": False}
        )
        assert response.status_code == 200, response.text
        roll = (await client.get(f"/api/vote/{vote.id}/roll/", headers=bearer(author))).json()
        assert sorted(u["id"] for u in roll["data"]) == sorted(keep)


class TestSearchingElectors:
    """The vote authority puts people on a roll: it must be able to find them (the user list is the other authority's)."""

    async def test_the_vote_authority_finds_active_accounts_by_name_or_address(self, client):
        author = await make_user("author", admin=True, authority="Vote")
        await make_user("ada")
        await make_user("grace")
        await make_user("ghost", active=False)
        found = (await client.get("/api/vote/electors/?search=gra", headers=bearer(author))).json()
        assert [u["username"] for u in found["data"]] == ["grace"]
        everybody = (await client.get("/api/vote/electors/?per_page=100", headers=bearer(author))).json()
        assert sorted(u["username"] for u in everybody["data"]) == ["ada", "author", "grace"]  # not the inactive one
        assert "password" not in str(everybody)

    async def test_nobody_else_searches(self, client):
        ada = await make_user("ada")
        registrar = await make_user("registrar", admin=True, authority="Inscription")
        for user in (ada, registrar):
            assert (await client.get("/api/vote/electors/", headers=bearer(user))).status_code == 403
        assert (await client.get("/api/vote/electors/")).status_code == 401

    async def test_the_search_is_paged_and_bounded(self, client):
        author = await make_user("author", admin=True, authority="Vote")
        for i in range(5):
            await make_user(f"person{i}")
        page = (await client.get("/api/vote/electors/?per_page=2&page=2", headers=bearer(author))).json()
        assert page["total_count"] == 6 and len(page["data"]) == 2
        assert (await client.get("/api/vote/electors/?per_page=1000", headers=bearer(author))).status_code == 422
