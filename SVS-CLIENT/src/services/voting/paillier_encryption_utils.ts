/**
 * Paillier ballots with zero-knowledge proofs.
 *
 * A ballot has an encryption of 0 or 1 for each candidate, each with a proof that it is a 0 or a 1, and a proof that the sum of all of
 * them is a 0 or a 1: at most one candidate. The server verifies all of it before recording the ballot (it cannot read the choice),
 * and anybody can verify it again from the bulletin board (SVS-SERVER/app/utils/audit.py). The Python side of the same protocol is
 * SVS-SERVER/app/models/voting_models.py: the two must hash exactly the same bytes (fsHash), and a test checks it against ballots
 * made by each side.
 *
 * Each proof is a Cramer–Damgård–Schoenmakers "1-out-of-2" OR proof, made non-interactive with the Fiat–Shamir heuristic (SHA-256).
 * With the Paillier ciphertext c = g^v · r^n mod n² and g = n + 1:
 *   - c encrypts 0  ⇔  c is an n-th power  ⇔  the prover knows r with r^n = c
 *   - c encrypts 1  ⇔  c/g is an n-th power
 * The prover runs the real protocol for the branch that is true and simulates the other one; the challenge is split between the two
 * so that it can only be simulated for one of them.
 */

import { randBetween, modPow, modInv } from "bigint-crypto-utils";
import type { PublicKey } from "paillier-bigint";
import type { BinaryZKProofModel, VoteCastData } from "@api/sdk";

/** Number of challenge bits (128 gives 128-bit soundness). */
const CHALLENGE_BITS = 128;
export const CHALLENGE_MASK = (1n << BigInt(CHALLENGE_BITS)) - 1n;
/** What the challenge is bound to, so that this proof cannot be taken for a proof of anything else. */
const PROOF_TAG = "svs-paillier-binary-proof-v1|";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The Fiat–Shamir challenge: SHA-256 of the tag and of the numbers written in hexadecimal, each padded to the width of n²
 * (so that (c, a0, a1) cannot be cut differently into the same text), truncated to 128 bits.
 */
export async function fsHash(n: bigint, values: bigint[]): Promise<bigint> {
    if (!globalThis.crypto?.subtle) {
        throw new Error("Le vote nécessite une connexion sécurisée (HTTPS).");
    }
    const width = 2 * Math.ceil(n.toString(2).length / 4);
    const combined = PROOF_TAG + values.map(v => v.toString(16).padStart(width, "0")).join("");
    const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(combined)));
    const hex = [...digest].map(b => b.toString(16).padStart(2, "0")).join("");
    return BigInt("0x" + hex) & CHALLENGE_MASK;
}

/** A random integer in [1, n). Invertible mod n except with a probability of about 2^-1000. */
const randomInZn = (n: bigint): bigint => randBetween(n - 1n, 1n);

/** A random challenge in [0, 2^128). */
const randomChallenge = (): bigint => randBetween(CHALLENGE_MASK, 0n);

const nSquaredOf = (publicKey: PublicKey): bigint => publicKey.n * publicKey.n;

const asProof = (a0: bigint, a1: bigint, e0: bigint, e1: bigint, z0: bigint, z1: bigint): BinaryZKProofModel => ({
    a0: a0.toString(),
    a1: a1.toString(),
    e0: e0.toString(),
    e1: e1.toString(),
    z0: z0.toString(),
    z1: z1.toString(),
});

// ---------------------------------------------------------------------------
// Encryption and proof generation
// ---------------------------------------------------------------------------

/**
 * Encrypts 0n or 1n, and keeps the randomness r: the proof needs it (paillier-bigint's encrypt() does not give it back).
 * c = g^v · r^n mod n²
 */
export function encryptBit(publicKey: PublicKey, v: 0n | 1n): { ciphertext: bigint; r: bigint } {
    if (v !== 0n && v !== 1n) throw new Error("v must be 0n or 1n");
    const n2 = nSquaredOf(publicKey);
    const r = randomInZn(publicKey.n);
    return { ciphertext: (modPow(publicKey.g, v, n2) * modPow(r, publicKey.n, n2)) % n2, r };
}

/**
 * A proof that `ciphertext`, which encrypts `v` (0n or 1n) with the randomness `r`, encrypts a 0 or a 1.
 * It is also used for the product of the ciphertexts of a ballot, with the product of their randomnesses.
 */
export async function proveBinary(
    publicKey: PublicKey,
    ciphertext: bigint,
    v: 0n | 1n,
    r: bigint,
): Promise<BinaryZKProofModel> {
    const { n, g } = publicKey;
    const n2 = nSquaredOf(publicKey);
    // c/g: what the ciphertext looks like if the vote is a 1
    const c1 = (ciphertext * modInv(g, n2)) % n2;

    // the real branch: a commitment u^n; the simulated branch: a challenge and a response chosen first, the commitment computed from them
    const u = randomInZn(n);
    const aReal = modPow(u, n, n2);
    const eFake = randomChallenge();
    const zFake = randomInZn(n);

    if (v === 0n) {
        // real: "c encrypts 0" (branch 0). simulated: "c/g encrypts 0" (branch 1), a1 = z1^n · (c/g)^(-e1)
        const a1 = (modPow(zFake, n, n2) * modInv(modPow(c1, eFake, n2), n2)) % n2;
        const e = await fsHash(n, [n, g, ciphertext, aReal, a1]);
        const e0 = e ^ eFake;
        const z0 = (u * modPow(r, e0, n)) % n;
        return asProof(aReal, a1, e0, eFake, z0, zFake);
    }
    // real: "c/g encrypts 0" (branch 1). simulated: "c encrypts 0" (branch 0), a0 = z0^n · c^(-e0)
    const a0 = (modPow(zFake, n, n2) * modInv(modPow(ciphertext, eFake, n2), n2)) % n2;
    const e = await fsHash(n, [n, g, ciphertext, a0, aReal]);
    const e1 = e ^ eFake;
    const z1 = (u * modPow(r, e1, n)) % n;
    return asProof(a0, aReal, eFake, e1, zFake, z1);
}

/** Encrypts 0n or 1n and proves that it is a 0 or a 1. */
export async function encryptWithBinaryProof(
    publicKey: PublicKey,
    vote: 0n | 1n,
): Promise<{ ciphertext: bigint; r: bigint; proof: BinaryZKProofModel }> {
    const { ciphertext, r } = encryptBit(publicKey, vote);
    return { ciphertext, r, proof: await proveBinary(publicKey, ciphertext, vote, r) };
}

/**
 * The ballot for `choice` (a candidate id), or a blank ballot (null): an entry for each candidate, and the proof that
 * the sum of the entries is a 0 or a 1. The product of the ciphertexts encrypts the sum, with the product of the randomnesses.
 */
export async function buildBallot(
    publicKey: PublicKey,
    candidateIds: number[],
    choice: number | null,
): Promise<VoteCastData> {
    const n2 = nSquaredOf(publicKey);
    if (choice !== null && !candidateIds.includes(choice)) throw new Error("choice is not a candidate");
    const content: VoteCastData["content"] = [];
    let product = 1n;
    let randomness = 1n;
    for (const candidateId of candidateIds) {
        const { ciphertext, r, proof } = await encryptWithBinaryProof(publicKey, candidateId === choice ? 1n : 0n);
        content.push({ candidate_id: candidateId, encrypted_value: ciphertext.toString(), proof });
        product = (product * ciphertext) % n2;
        randomness = (randomness * r) % publicKey.n;
    }
    const sumProof = await proveBinary(publicKey, product, choice === null ? 0n : 1n, randomness);
    return { content, sum_proof: sumProof };
}

// ---------------------------------------------------------------------------
// Proof verification (the server does the same; this is for the tests, and for anybody who wants to check a ballot)
// ---------------------------------------------------------------------------

/**
 * Verifies that `ciphertext` encrypts either 0 or 1, given the proof:
 *  1. e0 XOR e1 == H(n, g, c, a0, a1)          (the challenges are consistent)
 *  2. z0^n == a0 · c^e0          mod n²         (branch 0)
 *  3. z1^n == a1 · (c/g)^e1      mod n²         (branch 1)
 */
export async function verifyBinaryProof(
    publicKey: PublicKey,
    ciphertext: bigint,
    proof: BinaryZKProofModel,
): Promise<boolean> {
    const { n, g } = publicKey;
    const n2 = nSquaredOf(publicKey);
    try {
        const [a0, a1, e0, e1, z0, z1] = [proof.a0, proof.a1, proof.e0, proof.e1, proof.z0, proof.z1].map(x => BigInt(x));
        for (const unit of [ciphertext, a0, a1, z0, z1]) {
            if (unit <= 0n || unit >= n2) return false;
        }
        if (e0 < 0n || e0 > CHALLENGE_MASK || e1 < 0n || e1 > CHALLENGE_MASK) return false;
        if ((e0 ^ e1) !== (await fsHash(n, [n, g, ciphertext, a0, a1]))) return false;
        if (modPow(z0, n, n2) !== (a0 * modPow(ciphertext, e0, n2)) % n2) return false;
        const c1 = (ciphertext * modInv(g, n2)) % n2;
        return modPow(z1, n, n2) === (a1 * modPow(c1, e1, n2)) % n2;
    } catch {
        return false;
    }
}
