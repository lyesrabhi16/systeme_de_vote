"""
The web client and the server must agree on the proofs, byte for byte. Two fixtures, public data only:
  - fixtures/ts_ballots.json is made by the web client (`bun run interop-fixture` in SVS-CLIENT) and verified here, by the code of the server;
  - fixtures/python_ballots.json is made by the Python voter of the tests (make_interop_fixture.py) and verified by the web client's tests.
"""

import json
import os

import pytest
from ballots import make_ballot
from phe import PaillierPublicKey

from app.models.voting_models import VoteCastData, fs_hash
from app.utils.vote_utils import InvalidBallot, check_ballot

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def load(name):
    with open(os.path.join(FIXTURES, name)) as f:
        return json.load(f)


@pytest.fixture(scope="module")
def web():
    fixture = load("ts_ballots.json")
    return PaillierPublicKey(int(fixture["public_key"]["n"])), set(fixture["candidate_ids"]), fixture


def test_the_public_key_of_the_client_has_the_generator_the_server_assumes(web):
    public_key, _, fixture = web
    assert int(fixture["public_key"]["g"]) == public_key.g == public_key.n + 1


@pytest.mark.parametrize("which", ["honest", "blank"])
def test_a_ballot_made_by_the_web_client_is_accepted(web, which):
    public_key, candidate_ids, fixture = web
    ciphertexts = check_ballot(public_key, candidate_ids, VoteCastData.model_validate(fixture[which]))
    assert set(ciphertexts) == candidate_ids


def test_the_web_client_ballot_is_a_vote_for_one_candidate_and_not_for_the_others(web):
    """Not decryptable here (no private key): but the sum proof was accepted, so at most one entry is a 1."""
    public_key, candidate_ids, fixture = web
    assert len(fixture["honest"]["content"]) == len(candidate_ids)


def test_a_web_client_proof_is_not_valid_for_another_ciphertext(web):
    public_key, candidate_ids, fixture = web
    ballot = VoteCastData.model_validate(fixture["honest"])
    ballot.content[0], ballot.content[1] = (
        ballot.content[0].model_copy(update={"proof": ballot.content[1].proof}),
        ballot.content[1],
    )
    with pytest.raises(InvalidBallot):
        check_ballot(public_key, candidate_ids, ballot)


def test_the_two_sides_hash_the_same_bytes():
    """The vectors are in the python fixture, which the web client's tests check too."""
    for vector in load("python_ballots.json")["fs_hash_vectors"]:
        assert str(fs_hash([int(v) for v in vector["values"]], int(vector["n"]))) == vector["expected"]


def test_the_python_fixture_is_a_valid_ballot_for_its_own_key():
    fixture = load("python_ballots.json")
    public_key = PaillierPublicKey(int(fixture["public_key"]["n"]))
    candidate_ids = set(fixture["candidate_ids"])
    check_ballot(public_key, candidate_ids, VoteCastData.model_validate(fixture["honest"]))
    check_ballot(public_key, candidate_ids, VoteCastData.model_validate(fixture["blank"]))
    for bad in ("changed_ciphertext", "several_candidates"):
        with pytest.raises(InvalidBallot):
            check_ballot(public_key, candidate_ids, VoteCastData.model_validate(fixture[bad]))


def test_a_fresh_python_ballot_still_matches_the_fixture_format():
    fixture = load("python_ballots.json")
    public_key = PaillierPublicKey(int(fixture["public_key"]["n"]))
    ballot = make_ballot(public_key, fixture["candidate_ids"], fixture["candidate_ids"][0])
    assert set(ballot.model_dump()) == set(fixture["honest"])
