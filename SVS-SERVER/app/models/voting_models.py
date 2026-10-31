import hashlib
from math import gcd

from pydantic import BaseModel, Field

# 128 bits of challenge: the soundness of the proofs, and the same constant in the web client (paillier_encryption_utils.ts)
CHALLENGE_MASK = (1 << 128) - 1
# a decimal number of at most 4096 bits squared: bigger is not an encryption under any key this project makes
MAX_NUMBER_DIGITS = 5000
# what the challenge is bound to, so that this proof cannot be taken for a proof of anything else
PROOF_TAG = "svs-paillier-binary-proof-v1|"


def fs_hash(values: list[int], n: int) -> int:
    """
    The Fiat–Shamir challenge: SHA-256 of a tag and of the numbers written in hexadecimal, each padded to the width of n²,
    truncated to 128 bits. A fixed width keeps (c, a0, a1) from being cut differently into the same text.
    The web client computes exactly the same thing (fsHash in paillier_encryption_utils.ts).
    """
    width = 2 * ((n.bit_length() + 3) // 4)
    combined = PROOF_TAG + "".join(format(v, "x").zfill(width) for v in values)
    return int(hashlib.sha256(combined.encode("utf-8")).hexdigest(), 16) & CHALLENGE_MASK


class BinaryZKProofModel(BaseModel):
    """
    A non-interactive zero-knowledge proof (Cramer–Damgård–Schoenmakers OR proof, Fiat–Shamir) that a Paillier ciphertext
    encrypts 0 or 1, without saying which. Numbers are decimal strings, because they do not fit a JSON number.
    """

    a0: str = Field(max_length=MAX_NUMBER_DIGITS)
    a1: str = Field(max_length=MAX_NUMBER_DIGITS)
    e0: str = Field(max_length=MAX_NUMBER_DIGITS)
    e1: str = Field(max_length=MAX_NUMBER_DIGITS)
    z0: str = Field(max_length=MAX_NUMBER_DIGITS)
    z1: str = Field(max_length=MAX_NUMBER_DIGITS)

    def verify(self, public_key, ciphertext: int) -> bool:
        """
        Checks, for the public key (n, g = n + 1) and the ciphertext c:
          1. e0 XOR e1 equals the challenge e = H(n, g, c, a0, a1);
          2. z0^n = a0 * c^e0       (mod n²)   [c encrypts 0, or this branch was simulated]
          3. z1^n = a1 * (c/g)^e1   (mod n²)   [c encrypts 1, or this branch was simulated]
        Only one of the two branches can be simulated by a prover who does not know the randomness of c, and the challenge, fixed
        by the hash of the commitments, is split between them: so c encrypts 0 or 1.
        Anything malformed (not a number, out of range, not invertible) is simply not a valid proof.
        """
        try:
            n = public_key.n
            g = public_key.g
            n_sq = n * n
            a0, a1, e0, e1, z0, z1 = (int(x) for x in (self.a0, self.a1, self.e0, self.e1, self.z0, self.z1))
        except ValueError:
            return False

        # the values live in Z*_n² (commitments, responses, ciphertext) and in [0, 2^128) (challenges)
        for unit in (ciphertext, a0, a1, z0, z1):
            if not 0 < unit < n_sq or gcd(unit, n) != 1:
                return False
        if not (0 <= e0 <= CHALLENGE_MASK and 0 <= e1 <= CHALLENGE_MASK):
            return False

        if (e0 ^ e1) != fs_hash([n, g, ciphertext, a0, a1], n):
            return False
        if pow(z0, n, n_sq) != (a0 * pow(ciphertext, e0, n_sq)) % n_sq:
            return False
        c_over_g = (ciphertext * pow(g, -1, n_sq)) % n_sq
        return pow(z1, n, n_sq) == (a1 * pow(c_over_g, e1, n_sq)) % n_sq


class VoteCastContentModel(BaseModel):
    candidate_id: int
    encrypted_value: str = Field(max_length=MAX_NUMBER_DIGITS)
    proof: BinaryZKProofModel


class VoteCastData(BaseModel):
    """
    A ballot: for each candidate, an encryption of 0 or 1 with the proof that it is one of the two, and a proof that
    the sum of all of them (the product of the ciphertexts) is 0 or 1 too: at most one candidate. Without that second proof,
    a voter could encrypt a 1 for every candidate, and each one would pass.
    """

    content: list[VoteCastContentModel] = Field(max_length=500)
    sum_proof: BinaryZKProofModel


class VoteCastResponseModel(BaseModel):
    unique_code: str


class VoteAuditModel(BaseModel):
    """What anyone needs to check the count of an election with the bulletin board (see app/utils/audit.py)."""

    public_key: str
    counts: dict[int, int]
    encrypted_tally: dict[int, str]
    tally_proof: dict[int, str]
