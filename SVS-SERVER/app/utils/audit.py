"""
Checking an election from what is public, and nothing else.

Anyone can read the bulletin board (every ballot), the public key, the published result and the proofs of the count. This checks
that the ballots on the board are valid (every proof), that the encrypted sums are the product of them, and that each sum
decrypts to the published number (the n-th root the server published). It does not trust the server, and it needs no secret:

    python -m app.utils.audit https://vote.example.org 12

What it does not tell: whether the ballots on the board are all and only those of the people who voted (that is what the receipt
each voter is emailed is for: it must be on the board), and what the server did with the private key besides counting.
"""

import json
import sys
import urllib.request
from dataclasses import dataclass, field

from pydantic import ValidationError

from app.utils.vote_utils import InvalidBallot, check_ballot, decryption_is_correct, load_public_key
from app.models.voting_models import VoteCastData


@dataclass
class AuditReport:
    counts: dict[int, int] = field(default_factory=dict)  # recounted from the board: what the result must be, if it is right
    left_out: list[int] = field(default_factory=list)  # the bulletins that are not valid ballots
    problems: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.problems


def audit_election(
    public_key_json: str,
    candidate_ids: set[int],
    bulletins: list[tuple[int, str]],
    published_counts: dict[int, int],
    published_tally: dict[int, int],
    published_proofs: dict[int, int],
) -> AuditReport:
    """Everything is given as it is published: nothing here reads a database or a secret."""
    report = AuditReport()
    public_key = load_public_key(public_key_json)
    n_square = public_key.nsquare

    tally = dict.fromkeys(candidate_ids, 1)
    for bulletin_id, content in bulletins:
        try:
            ciphertexts = check_ballot(public_key, candidate_ids, VoteCastData.model_validate_json(content))
        except (InvalidBallot, ValidationError, ValueError):
            report.left_out.append(bulletin_id)
            continue
        for candidate_id, ciphertext in ciphertexts.items():
            tally[candidate_id] = tally[candidate_id] * ciphertext % n_square

    for candidate_id in sorted(candidate_ids):
        if published_tally.get(candidate_id) != tally[candidate_id]:
            report.problems.append(f"candidate {candidate_id}: the published encrypted sum is not the product of the valid ballots")
            continue
        count, witness = published_counts.get(candidate_id), published_proofs.get(candidate_id)
        if count is None or witness is None or not decryption_is_correct(public_key, tally[candidate_id], count, witness):
            report.problems.append(f"candidate {candidate_id}: the published count is not what the encrypted sum decrypts to")
            continue
        report.counts[candidate_id] = count
    return report


def _get(url: str):
    with urllib.request.urlopen(url) as response:  # noqa: S310 - the address is the one the auditor typed
        return json.load(response)


def audit_server(base_url: str, vote_id: int) -> AuditReport:
    """Reads everything from the public routes of a server and audits it."""
    base = base_url.rstrip("/")
    published = _get(f"{base}/api/vote/audit/{vote_id}/")
    bulletins, page = [], 1
    while True:
        batch = _get(f"{base}/api/vote/bulletins/{vote_id}/?page={page}&items_per_page=100")
        bulletins += [(b["id"], b["content"]) for b in batch["data"]]
        if page * 100 >= batch["total_count"]:
            break
        page += 1
    return audit_election(
        published["public_key"],
        {int(k) for k in published["counts"]},
        bulletins,
        {int(k): v for k, v in published["counts"].items()},
        {int(k): int(v) for k, v in published["encrypted_tally"].items()},
        {int(k): int(v) for k, v in published["tally_proof"].items()},
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python -m app.utils.audit <server address> <election id>")
    result = audit_server(sys.argv[1], int(sys.argv[2]))
    print(f"counts recomputed from the bulletin board: {result.counts}")
    print(f"bulletins that are not valid ballots: {result.left_out}")
    for problem in result.problems:
        print(f"PROBLEM: {problem}")
    print("The result is verified." if result.ok else "The result does NOT verify.")
    sys.exit(0 if result.ok else 1)
