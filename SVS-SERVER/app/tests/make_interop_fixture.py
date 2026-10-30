"""
Writes app/tests/fixtures/python_ballots.json: ballots made by the Python voter (ballots.py), for the web client's tests to verify
(SVS-CLIENT/src/services/voting/paillier.test.ts). The other direction, ballots made by the web client, is
fixtures/ts_ballots.json (written by `bun run interop-fixture` in SVS-CLIENT) and verified by test_interop.py.
Only public data goes into the fixtures: a public key and ballots.

    ENV_MODE=testing python app/tests/make_interop_fixture.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from ballots import make_ballot, make_ballot_for_several  # noqa: E402
from phe import paillier  # noqa: E402

from app.models.voting_models import fs_hash  # noqa: E402

CANDIDATES = [11, 22, 33]


def main() -> None:
    public_key, _ = paillier.generate_paillier_keypair(n_length=1024)
    honest = make_ballot(public_key, CANDIDATES, 22)
    blank = make_ballot(public_key, CANDIDATES, None)
    changed = make_ballot(public_key, CANDIDATES, 22)
    changed.content[0].encrypted_value = str(int(changed.content[0].encrypted_value) + 1)
    cheat = make_ballot_for_several(public_key, CANDIDATES, [11, 22])
    vectors = [
        {"n": str(n), "values": [str(v) for v in values], "expected": str(fs_hash(values, n))}
        for n, values in (
            (public_key.n, [public_key.n, public_key.g, 12345, 6789, 1011]),
            (public_key.n, [public_key.n, public_key.g, public_key.nsquare - 1, 1, 2]),
            (2**64 + 13, [2**64 + 13, 2**64 + 14, 5, 6, 7]),
        )
    ]
    fixture = {
        "public_key": {"n": str(public_key.n), "g": str(public_key.g)},
        "candidate_ids": CANDIDATES,
        "honest": honest.model_dump(),
        "blank": blank.model_dump(),
        "changed_ciphertext": changed.model_dump(),
        "several_candidates": cheat.model_dump(),
        "fs_hash_vectors": vectors,
    }
    path = os.path.join(os.path.dirname(__file__), "fixtures", "python_ballots.json")
    with open(path, "w") as f:
        json.dump(fixture, f, indent=1)
        f.write("\n")
    print(f"written {path}")


if __name__ == "__main__":
    main()
