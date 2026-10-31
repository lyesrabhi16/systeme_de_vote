"""What the API never says: the private key of an election, the hash of a password."""

from datetime import timedelta

import pytest
from helpers import bearer, make_user, make_vote


@pytest.fixture
async def world():
    admin = await make_user("admin", admin=True, authority="Vote")
    ada = await make_user("ada")
    vote, candidates = await make_vote(admin, [ada])
    return admin, ada, vote, candidates


def assert_no_election_secret(response, vote):
    assert response.status_code == 200, response.text
    assert vote.encrypted_private_key not in response.text
    assert "encrypted_private_key" not in response.text


class TestElectionKeys:
    @pytest.mark.parametrize("path", ["attributed", "available", "voted", "finishedVotes", "", "{id}/", "result/{id}/"])
    async def test_what_a_voter_can_read_has_no_private_key(self, client, world, path):
        _, ada, vote, _ = world
        response = await client.get(f"/api/vote/{path.format(id=vote.id)}", headers=bearer(ada))
        assert_no_election_secret(response, vote)

    async def test_the_list_of_an_administrator_has_no_private_key(self, client, world):
        admin, _, vote, _ = world
        for path in ("", "created", "attributed"):
            assert_no_election_secret(await client.get(f"/api/vote/{path}", headers=bearer(admin)), vote)

    async def test_the_public_key_is_shown(self, client, world):
        """It is what the voters encrypt with."""
        _, ada, vote, _ = world
        listed = (await client.get("/api/vote/available", headers=bearer(ada))).json()
        assert listed[0]["public_key"] == vote.public_key

    async def test_creating_and_updating_an_election_does_not_return_it_either(self, client, world):
        admin, _, vote, _ = world
        created = await client.post(
            "/api/vote/",
            headers=bearer(admin),
            json={
                "title": "New",
                "description": "",
                "start_date": "2099-01-01T00:00:00",
                "end_date": "2099-01-02T00:00:00",
                "candidates": [{"first_name": "A", "last_name": "B"}, {"first_name": "C", "last_name": "D"}],
                "attributed_user_ids": [],
            },
        )
        assert created.status_code == 200, created.text
        assert "encrypted_private_key" not in created.text

    async def test_an_administrator_cannot_choose_the_keys_of_an_election(self, client):
        """They used to be accepted by the update: whoever sets the key of an election can read its ballots."""
        admin = await make_user("admin", admin=True, authority="Vote")
        vote, _ = await make_vote(admin, [], starts_in=timedelta(days=1), ends_in=timedelta(days=2))
        public_key, encrypted_private_key = vote.public_key, vote.encrypted_private_key
        response = await client.put(
            f"/api/vote/{vote.id}/",
            headers=bearer(admin),
            json={"title": "Renamed", "public_key": "mine", "private_key": "mine too"},
        )
        assert response.status_code == 200, response.text
        from app.models import Vote

        stored = await Vote.get_by_id(vote.id)
        assert stored.title == "Renamed"
        assert (stored.public_key, stored.encrypted_private_key) == (public_key, encrypted_private_key)


class TestPasswordHashes:
    async def test_the_administrators_of_the_users_do_not_see_them(self, client):
        admin = await make_user("admin", admin=True, authority="Inscription")
        ada = await make_user("ada")
        got = await client.get(f"/api/users/admin/{ada.id}", headers=bearer(admin))
        assert got.status_code == 200, got.text
        assert "password" not in got.json() and ada.password not in got.text
        assert got.json()["verified_email"] is True  # what their form needs
        put = await client.put(f"/api/users/admin/{ada.id}", headers=bearer(admin), json={"first_name": "Ada"})
        assert put.status_code == 200, put.text
        assert "password" not in put.json() and ada.password not in put.text

    async def test_the_current_user_does_not_either(self, client):
        ada = await make_user("ada")
        me = await client.post("/api/auth/user/me", headers=bearer(ada))
        assert ada.password not in me.text and "password" not in me.json()


class TestWhoseAccount:
    async def test_somebody_else_s_email_and_phone_are_not_for_everyone(self, client):
        ada, grace = await make_user("ada"), await make_user("grace")
        assert (await client.get(f"/api/users/{grace.id}", headers=bearer(ada))).status_code == 403
        own = await client.get(f"/api/users/{ada.id}", headers=bearer(ada))
        assert own.status_code == 200 and own.json()["email"] == "ada@example.com"

    async def test_an_administrator_may_look_at_anybody(self, client):
        admin, grace = await make_user("admin", admin=True), await make_user("grace")
        assert (await client.get(f"/api/users/{grace.id}", headers=bearer(admin))).status_code == 200

    async def test_an_unknown_account_is_a_404(self, client):
        admin = await make_user("admin", admin=True)
        assert (await client.get("/api/users/9999", headers=bearer(admin))).status_code == 404
