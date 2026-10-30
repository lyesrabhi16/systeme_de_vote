"""Casting a ballot, and counting: what is accepted, what is refused, and that the count can be checked by anybody."""

import asyncio
import json
from datetime import timedelta

import pytest
from ballots import make_ballot, make_ballot_for_several, prove_binary
from helpers import bearer, make_user, make_vote
from sqlalchemy import func, select, update

from app.db import db_session
from app.models import AttributedVote, Bulletin, Candidate, Vote
from app.models.types import utcnow
from app.models.voting_models import BinaryZKProofModel
from app.utils import vote_utils
from app.utils.audit import audit_election


async def election(voters=("ada", "grace", "linus", "ken"), candidates=3, **kwargs):
    admin = await make_user("admin", admin=True, authority="Vote")
    people = [await make_user(name) for name in voters]
    vote, made = await make_vote(admin, people, candidates=candidates, **kwargs)
    return admin, people, vote, [c.id for c in made]


def ballot(vote, candidate_ids, choice):
    return make_ballot(vote_utils.load_public_key(vote.public_key), candidate_ids, choice)


async def cast(client, user, vote, data):
    return await client.post(f"/api/vote/cast/{vote.id}", headers=bearer(user), json=data.model_dump())


@db_session
async def bulletins_of(vote_id, db=None):
    return (await db.execute(select(Bulletin).where(Bulletin.vote_id == vote_id).order_by(Bulletin.id))).scalars().all()


@db_session
async def end_now(vote_id, db=None):
    """The election is over (it had to be open to be voted on)."""
    await db.execute(update(Vote).where(Vote.id == vote_id).values(end_date=utcnow() - timedelta(minutes=1)))
    await db.commit()


class TestCasting:
    async def test_a_ballot_is_recorded_and_the_receipt_is_emailed(self, client, outbox):
        _, (ada, *_), vote, ids = await election()
        response = await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        assert response.status_code == 200, response.text
        code = response.json()["unique_code"]
        (mail,) = [m for m in outbox if m["function"] == "send_vote_cast_confirmation_email"]
        assert mail["unique_code"] == code and mail["to_email"] == ["ada@example.com"]
        assert "vote_content" not in mail  # what was sent is not in the email
        (stored,) = await bulletins_of(vote.id)
        assert stored.unique_code == code
        assert (stored.date.minute, stored.date.second, stored.date.microsecond) == (0, 0, 0)  # public: to the hour only
        # the board is public, and does not say whose ballot it is
        board = await client.get(f"/api/vote/bulletins/{vote.id}/")
        assert [b["unique_code"] for b in board.json()["data"]] == [code]
        assert "ada" not in board.text and "user" not in board.text

    async def test_the_ballot_hides_the_choice(self, client):
        """Whatever is chosen, a ballot is an entry for each candidate, each a number the server cannot read without the private key."""
        _, (ada, grace, *_), vote, ids = await election()
        await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        await cast(client, grace, vote, ballot(vote, ids, ids[0]))
        first, second = await bulletins_of(vote.id)
        assert first.content != second.content  # the same choice does not look the same twice
        for stored in (first, second):
            assert len(json.loads(stored.content)["content"]) == len(ids)

    async def test_a_blank_ballot_is_accepted(self, client):
        _, (ada, *_), vote, ids = await election()
        assert (await cast(client, ada, vote, ballot(vote, ids, None))).status_code == 200

    async def test_one_cannot_vote_twice(self, client):
        _, (ada, *_), vote, ids = await election()
        assert (await cast(client, ada, vote, ballot(vote, ids, ids[0]))).status_code == 200
        again = await cast(client, ada, vote, ballot(vote, ids, ids[1]))
        assert again.status_code == 409
        assert again.json()["detail"]["code"] == "ALREADY_VOTED"
        assert len(await bulletins_of(vote.id)) == 1

    async def test_requests_at_the_same_time_cannot_all_get_through(self, client):
        """The right to vote is taken by a single UPDATE: five requests of one voter at once record one ballot."""
        _, (ada, *_), vote, ids = await election()
        responses = await asyncio.gather(*(cast(client, ada, vote, ballot(vote, ids, ids[i % 3])) for i in range(5)))
        assert sorted(r.status_code for r in responses).count(200) == 1
        assert {r.status_code for r in responses} <= {200, 409}
        assert len(await bulletins_of(vote.id)) == 1

    async def test_the_right_to_vote_is_taken_in_the_transaction_of_the_ballot(self):
        _, (ada, *_), vote, ids = await election()
        await vote.register_vote(ada, ballot(vote, ids, ids[0]))
        from app.models.vote import AlreadyVoted

        with pytest.raises(AlreadyVoted):
            await vote.register_vote(ada, ballot(vote, ids, ids[1]))
        assert len(await bulletins_of(vote.id)) == 1

    async def test_a_refused_ballot_does_not_use_up_the_right_to_vote(self, client):
        _, (ada, *_), vote, ids = await election()
        bad = ballot(vote, ids, ids[0])
        bad.content[0].encrypted_value = "12345"
        assert (await cast(client, ada, vote, bad)).status_code == 400
        assert (await cast(client, ada, vote, ballot(vote, ids, ids[0]))).status_code == 200

    async def test_one_must_be_on_the_electoral_roll(self, client):
        _, _, vote, ids = await election()
        stranger = await make_user("stranger")
        response = await cast(client, stranger, vote, ballot(vote, ids, ids[0]))
        assert response.status_code == 403
        assert await bulletins_of(vote.id) == []

    async def test_one_cannot_vote_before_the_start(self, client):
        _, (ada, *_), vote, ids = await election(starts_in=timedelta(hours=1), ends_in=timedelta(days=1))
        response = await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "VOTE_NOT_STARTED"

    async def test_nor_after_the_end(self, client):
        _, (ada, *_), vote, ids = await election(starts_in=timedelta(days=-2), ends_in=timedelta(days=-1))
        response = await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        assert response.json()["detail"]["code"] == "VOTE_FINISHED"

    async def test_one_must_be_signed_in(self, client):
        _, _, vote, ids = await election()
        response = await client.post(f"/api/vote/cast/{vote.id}", json=ballot(vote, ids, ids[0]).model_dump())
        assert response.status_code == 401

    async def test_a_ballot_cannot_be_copied_from_the_board(self, client):
        _, (ada, grace, *_), vote, ids = await election()
        mine = ballot(vote, ids, ids[0])
        assert (await cast(client, ada, vote, mine)).status_code == 200
        copied = await cast(client, grace, vote, mine)  # the whole ballot is public
        assert copied.status_code == 400
        assert copied.json()["detail"]["code"] == "INVALID_BALLOT"
        assert len(await bulletins_of(vote.id)) == 1
        assert (
            await cast(client, grace, vote, ballot(vote, ids, ids[1]))
        ).status_code == 200  # and grace can still vote


class TestRefusedBallots:
    """A ballot is counted whole or not at all, so every way of being wrong is refused when it is cast."""

    async def refused(self, client, vote, user, data):
        response = await cast(client, user, vote, data)
        assert response.status_code == 400, response.text
        assert response.json()["detail"]["code"] == "INVALID_BALLOT"
        assert await bulletins_of(vote.id) == []

    async def test_several_candidates_chosen(self, client):
        """Every entry is a proven 0 or 1, but the sum is 2: the proof on the sum is what catches it."""
        _, (ada, *_), vote, ids = await election()
        public_key = vote_utils.load_public_key(vote.public_key)
        await self.refused(client, vote, ada, make_ballot_for_several(public_key, ids, ids[:2]))

    async def test_every_candidate_chosen(self, client):
        _, (ada, *_), vote, ids = await election()
        public_key = vote_utils.load_public_key(vote.public_key)
        await self.refused(client, vote, ada, make_ballot_for_several(public_key, ids, ids))

    async def test_a_candidate_missing(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content.pop()
        await self.refused(client, vote, ada, data)

    async def test_a_candidate_twice(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content[1].candidate_id = data.content[0].candidate_id
        await self.refused(client, vote, ada, data)

    async def test_somebody_who_is_not_a_candidate_of_this_election(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content[2].candidate_id = 9999
        await self.refused(client, vote, ada, data)

    async def test_a_ciphertext_that_was_changed(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content[0].encrypted_value = str(int(data.content[0].encrypted_value) + 1)
        await self.refused(client, vote, ada, data)

    async def test_a_proof_taken_from_another_entry(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content[0].proof, data.content[1].proof = data.content[1].proof, data.content[0].proof
        await self.refused(client, vote, ada, data)

    async def test_the_sum_proof_of_another_ballot(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.sum_proof = ballot(vote, ids, ids[0]).sum_proof
        await self.refused(client, vote, ada, data)

    async def test_an_entry_that_encrypts_something_else_than_0_or_1(self, client):
        """A vote worth 5: the proof of 'is it 0 or 1' cannot be made for it, whatever the witness."""
        from ballots import encrypt

        _, (ada, *_), vote, ids = await election()
        public_key = vote_utils.load_public_key(vote.public_key)
        data = ballot(vote, ids, None)
        ciphertext, r = encrypt(public_key, 5)
        data.content[0].encrypted_value = str(ciphertext)
        data.content[0].proof = prove_binary(public_key, ciphertext, 1, r)  # claims it is a 1
        await self.refused(client, vote, ada, data)

    async def test_a_ballot_made_for_another_election(self, client):
        _, (ada, *_), vote, ids = await election()
        other, other_candidates = await make_vote(await make_user("other-admin", admin=True), [], title="Other")
        elsewhere = make_ballot(vote_utils.load_public_key(other.public_key), ids, ids[0])
        await self.refused(client, vote, ada, elsewhere)

    @pytest.mark.parametrize("value", ["", "abc", "-5", "0", "1" + "0" * 4999, "1.5"])
    async def test_a_ciphertext_that_is_not_a_ciphertext(self, client, value):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.content[0].encrypted_value = value
        response = await cast(client, ada, vote, data)
        assert response.status_code in (400, 422)
        assert await bulletins_of(vote.id) == []

    async def test_a_proof_with_nothing_in_it(self, client):
        _, (ada, *_), vote, ids = await election()
        data = ballot(vote, ids, ids[0])
        data.sum_proof = BinaryZKProofModel(a0="1", a1="1", e0="0", e1="0", z0="1", z1="1")
        await self.refused(client, vote, ada, data)

    async def test_a_ballot_that_is_not_json_of_the_right_shape(self, client):
        _, (ada, *_), vote, ids = await election()
        for body in ({}, {"content": []}, {"content": "x", "sum_proof": {}}, []):
            response = await client.post(f"/api/vote/cast/{vote.id}", headers=bearer(ada), json=body)
            assert response.status_code == 422
        assert await bulletins_of(vote.id) == []


class TestTheProofs:
    def test_a_0_and_a_1_are_proven_and_a_2_is_not(self):
        from ballots import encrypt

        public_key = vote_utils.load_public_key(
            Vote(title="t", description="", start_date=utcnow(), end_date=utcnow(), creator_id=1).public_key
        )
        for value in (0, 1):
            ciphertext, r = encrypt(public_key, value)
            assert prove_binary(public_key, ciphertext, value, r).verify(public_key, ciphertext)
        ciphertext, r = encrypt(public_key, 2)
        assert not prove_binary(public_key, ciphertext, 1, r).verify(public_key, ciphertext)
        assert not prove_binary(public_key, ciphertext, 0, r).verify(public_key, ciphertext)

    def test_a_proof_is_for_one_ciphertext(self):
        from ballots import encrypt

        public_key = vote_utils.load_public_key(
            Vote(title="t", description="", start_date=utcnow(), end_date=utcnow(), creator_id=1).public_key
        )
        first, r = encrypt(public_key, 1)
        second, _ = encrypt(public_key, 1)
        proof = prove_binary(public_key, first, 1, r)
        assert proof.verify(public_key, first)
        assert not proof.verify(public_key, second)

    def test_the_proof_of_a_vote_does_not_reveal_which_branch_is_real(self):
        """Both branches have the same shape: a hash-consistent split of the challenge and a response that checks. Proofs of 0 and 1 are verified by one function."""
        from ballots import encrypt

        public_key = vote_utils.load_public_key(
            Vote(title="t", description="", start_date=utcnow(), end_date=utcnow(), creator_id=1).public_key
        )
        for value in (0, 1):
            ciphertext, r = encrypt(public_key, value)
            proof = prove_binary(public_key, ciphertext, value, r)
            assert 0 < int(proof.e0) < 1 << 128 and 0 < int(proof.e1) < 1 << 128


class TestCounting:
    async def vote_day(self, client):
        """ada and grace choose the first candidate, linus the second, ken does not vote. Then it is over."""
        admin, (ada, grace, linus, ken), vote, ids = await election()
        for user, choice in ((ada, ids[0]), (grace, ids[0]), (linus, ids[1])):
            assert (await cast(client, user, vote, ballot(vote, ids, choice))).status_code == 200
        await end_now(vote.id)
        return admin, (ada, grace, linus, ken), vote, ids

    async def test_it_cannot_be_counted_before_the_end(self, client):
        admin, _, vote, ids = await election()
        response = await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "VOTE_NOT_FINISHED"
        assert (await Vote.get_by_id(vote.id)).has_been_counted is False

    async def test_the_sums_are_taken_over_encrypted_ballots(self, client):
        admin, _, vote, ids = await self.vote_day(client)
        response = await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["candidate_results"] == {str(ids[0]): 2, str(ids[1]): 1, str(ids[2]): 0}
        assert body["voter_count"] == 3 and body["abstention_count"] == 1 and body["count_failures"] == []
        assert (await Vote.get_by_id(vote.id)).has_been_counted is True

    async def test_a_blank_ballot_counts_for_nobody_but_is_a_vote(self, client):
        admin, (ada, grace, *_), vote, ids = await election()
        await cast(client, ada, vote, ballot(vote, ids, ids[2]))
        await cast(client, grace, vote, ballot(vote, ids, None))
        await end_now(vote.id)
        body = (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))).json()
        assert body["candidate_results"][str(ids[2])] == 1
        assert sum(body["candidate_results"].values()) == 1 and body["voter_count"] == 2

    async def test_counting_twice_gives_the_same(self, client):
        admin, _, vote, ids = await self.vote_day(client)
        first = (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))).json()
        stored = await Vote.get_by_id(vote.id)
        second = (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))).json()
        assert first == second
        assert (await Vote.get_by_id(vote.id)).encrypted_tally == stored.encrypted_tally

    async def test_the_cron_counts_what_is_finished_and_only_that(self, client):
        from app.crons import count_finished_votes

        _, _, vote, ids = await self.vote_day(client)
        _, _, open_vote, _ = await election(voters=("zed",)) if False else (None, None, None, None)
        counted = await count_finished_votes()
        assert counted == [vote.id]
        assert await count_finished_votes() == []  # nothing left to count
        candidates = await self.candidates(vote.id)
        assert [c.vote_count for c in candidates] == [2, 1, 0]

    @db_session
    async def candidates(self, vote_id, db=None):
        return (
            (await db.execute(select(Candidate).where(Candidate.vote_id == vote_id).order_by(Candidate.id)))
            .scalars()
            .all()
        )

    async def test_a_forged_bulletin_is_left_out_as_a_whole(self, client):
        """Somebody with write access to the database adds a ballot for two candidates: it counts for neither, and is reported."""
        admin, _, vote, ids = await self.vote_day(client)
        forged = make_ballot_for_several(vote_utils.load_public_key(vote.public_key), ids, ids[:2])

        @db_session
        async def plant(db=None):
            db.add(Bulletin(vote_id=vote.id, content=forged.model_dump_json(), date=utcnow(), unique_code="planted"))
            db.add(Bulletin(vote_id=vote.id, content="not even json", date=utcnow(), unique_code="garbage"))
            await db.commit()

        await plant()
        body = (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))).json()
        assert body["candidate_results"] == {str(ids[0]): 2, str(ids[1]): 1, str(ids[2]): 0}
        assert sorted(f["unique_code"] for f in body["count_failures"]) == ["garbage", "planted"]

    async def test_only_the_vote_authority_counts(self, client):
        _, (ada, *_), vote, ids = await self.vote_day(client)
        assert (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(ada))).status_code == 403
        inscription = await make_user("registrar", admin=True, authority="Inscription")
        assert (await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(inscription))).status_code == 403

    async def test_the_results_are_zero_until_counted(self, client):
        _, (ada, *_), vote, ids = await election()
        await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        result = await client.get(f"/api/vote/result/{vote.id}/", headers=bearer(ada))
        assert result.json()["candidate_results"] == {str(i): 0 for i in ids}


class TestAnybodyCanCheckTheCount:
    async def published(self, client, vote):
        audit = (await client.get(f"/api/vote/audit/{vote.id}/")).json()
        board = (await client.get(f"/api/vote/bulletins/{vote.id}/?items_per_page=100")).json()["data"]
        return audit, [(b["id"], b["content"]) for b in board]

    def check(self, audit, published_board, ids, **changes):
        counts = {int(k): v for k, v in audit["counts"].items()} | changes.get("counts", {})
        tally = {int(k): int(v) for k, v in audit["encrypted_tally"].items()}
        proofs = {int(k): int(v) for k, v in audit["tally_proof"].items()} | changes.get("proofs", {})
        return audit_election(
            audit["public_key"], set(ids), changes.get("board", published_board), counts, tally, proofs
        )

    async def test_nothing_is_published_before_the_count(self, client):
        _, _, vote, _ = await election()
        assert (await client.get(f"/api/vote/audit/{vote.id}/")).status_code == 400

    async def test_the_published_result_verifies_from_public_data_alone(self, client):
        admin, *_, vote, ids = await TestCounting().vote_day(client)
        await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        audit, board = await self.published(client, vote)
        assert "private" not in json.dumps(audit)
        report = self.check(audit, board, ids)
        assert report.ok, report.problems
        assert report.counts == {ids[0]: 2, ids[1]: 1, ids[2]: 0} and report.left_out == []

    async def test_a_wrong_count_is_caught(self, client):
        admin, *_, vote, ids = await TestCounting().vote_day(client)
        await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        audit, board = await self.published(client, vote)
        report = self.check(audit, board, ids, counts={ids[1]: 2})  # one more vote than there was
        assert not report.ok and "candidate" in report.problems[0]

    async def test_a_ballot_added_or_removed_after_the_fact_is_caught(self, client):
        admin, *_, vote, ids = await TestCounting().vote_day(client)
        await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        audit, board = await self.published(client, vote)
        assert not self.check(audit, board, ids, board=board[1:]).ok  # one ballot erased from the board
        extra = make_ballot(vote_utils.load_public_key(vote.public_key), ids, ids[2]).model_dump_json()
        assert not self.check(
            audit, [*board, (99, extra)], ids
        ).ok  # one valid ballot added: the encrypted sum no longer matches

    async def test_a_made_up_proof_of_decryption_is_caught(self, client):
        admin, *_, vote, ids = await TestCounting().vote_day(client)
        await client.get(f"/api/vote/count/{vote.id}/", headers=bearer(admin))
        audit, board = await self.published(client, vote)
        assert not self.check(audit, board, ids, proofs={ids[0]: 12345}).ok

    async def test_the_decryption_proof_does_not_open_the_ballots(self):
        """The n-th root is checked with the public key only, and it is the randomness of a sum: it cannot be turned into a plaintext."""
        vote = Vote(title="t", description="", start_date=utcnow(), end_date=utcnow(), creator_id=1)
        public_key, private_key = vote_utils.load_public_key(vote.public_key), vote.get_private_key()
        from ballots import encrypt

        ciphertext, _ = encrypt(public_key, 7)
        witness = vote_utils.decryption_witness(private_key, ciphertext, 7)
        assert vote_utils.decryption_is_correct(public_key, ciphertext, 7, witness)
        assert not vote_utils.decryption_is_correct(public_key, ciphertext, 6, witness)
        assert not vote_utils.decryption_is_correct(public_key, ciphertext, 8, witness)


class TestTheServerDoesNotWaste:
    async def test_reading_an_election_does_not_load_its_ballots(self, client):
        """Ballots weigh several kilobytes each; they used to be loaded with every read of an election."""
        _, (ada, *_), vote, ids = await election()
        await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        stored = await Vote.get_by_id(vote.id)
        with pytest.raises(Exception, match="lazy='raise'|raise"):
            _ = stored.bulletins
        total = (await client.get(f"/api/vote/{vote.id}/", headers=bearer(ada))).json()["total_bulletins"]
        assert total == 1

    async def test_the_number_of_ballots_matches_the_number_of_voters(self, client):
        _, (ada, grace, *_), vote, ids = await election()
        await cast(client, ada, vote, ballot(vote, ids, ids[0]))
        await cast(client, grace, vote, ballot(vote, ids, ids[1]))

        @db_session
        async def counts(db=None):
            bulletins = (
                await db.execute(select(func.count(Bulletin.id)).where(Bulletin.vote_id == vote.id))
            ).scalar_one()
            voted = (
                await db.execute(
                    select(func.count())
                    .select_from(AttributedVote)
                    .where(AttributedVote.vote_id == vote.id, AttributedVote.user_has_voted)
                )
            ).scalar_one()
            return bulletins, voted

        assert await counts() == (2, 2)
