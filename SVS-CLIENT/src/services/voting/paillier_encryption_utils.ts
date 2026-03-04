/**
 * Paillier Binary ZKP — Non-interactive OR proof that a ciphertext encrypts 0 or 1.
 *
 * Protocol: Cramer–Damgård–Schoenmakers "1-out-of-2" disjunctive proof,
 * made non-interactive via the Fiat–Shamir heuristic (SHA-256).
 *
 * Install deps:
 *   npm install paillier-bigint bigint-crypto-utils
 *   npm install --save-dev @types/node typescript
 *
 * Run:
 *   npx ts-node paillier-binary-zkp.ts
 */

import * as paillier from "paillier-bigint";
import * as bigintCryptoUtils from "bigint-crypto-utils";
import { type BinaryZKProofModel } from "@api/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/* export interface BinaryProof {
    Commitment for the "encrypts 0" branch
    a0: bigint;
    Commitment for the "encrypts 1" branch
    a1: bigint;
    Challenge for the "encrypts 0" branch
    e0: bigint;
    Challenge for the "encrypts 1" branch
    e1: bigint;
    Response for the "encrypts 0" branch
    z0: bigint;
    Response for the "encrypts 1" branch
    z1: bigint;
}
*/

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Number of challenge bits (128 gives 128-bit soundness). */
const CHALLENGE_BITS = 128;
const CHALLENGE_MASK = (1n << BigInt(CHALLENGE_BITS)) - 1n;

/**
 * Fiat–Shamir hash: H(n, g, c, a0, a1) → bigint, truncated to CHALLENGE_BITS.
 */
async function fsHash(...values: bigint[]): Promise<bigint> {
    const encoder = new TextEncoder();

    let combined = "";

    for (const v of values) {
        const hex = v.toString(16).padStart(512, "0");
        combined += hex;
    }

    const data = encoder.encode(combined);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = [...hashArray]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return BigInt("0x" + hashHex) & CHALLENGE_MASK;
}

/**
 * Draw a random bigint in [1, n).
 */
async function randomInZn(n: bigint): Promise<bigint> {
    return bigintCryptoUtils.randBetween(n, 1n);
}

// ---------------------------------------------------------------------------
// Proof generation
// ---------------------------------------------------------------------------

/**
 * Encrypt `vote` (must be 0n or 1n) and produce a ZK proof that the
 * ciphertext is a valid binary vote.
 *
 * Returns the ciphertext and the proof. The randomness `r` used for
 * encryption is kept secret inside this function.
 *
 * The Paillier ciphertext is: c = g^v * r^n  mod n²
 * For g = n+1 (the standard choice in paillier-bigint): c = (1+n)^v * r^n mod n²
 * So the "1 branch" tests c / g = c * g^(-1) mod n².
 */
export async function encryptWithBinaryProof(
    publicKey: paillier.PublicKey,
    vote: 0n | 1n
): Promise<{ ciphertext: bigint; proof: BinaryZKProofModel }> {
    if (vote !== 0n && vote !== 1n) throw new Error("vote must be 0n or 1n");

    const { n, g, _n2: n2 } = publicKey as any;
    // paillier-bigint exposes _n2 as the internal n² value
    const nSquared: bigint = n2 ?? n * n;

    // Encrypt the vote. paillier-bigint's encrypt() internally picks a random r.
    // We need r for the proof, so we replicate the encryption manually.
    const r: bigint = await randomInZn(n);
    // c = g^v * r^n mod n²
    const ciphertext =
        (bigintCryptoUtils.modPow(g, vote, nSquared) *
            bigintCryptoUtils.modPow(r, n, nSquared)) %
        nSquared;

    // g_inv = g^(-1) mod n²  — used for the "branch 1" ciphertext c/g
    const gInv = bigintCryptoUtils.modInv(g, nSquared);
    // c1 = ciphertext * g^(-1) mod n²  (= what ciphertext looks like if vote=1)
    const c1 = (ciphertext * gInv) % nSquared;

    let proof: BinaryZKProofModel;

    if (vote === 0n) {
        // -----------------------------------------------------------------------
        // Real branch: vote = 0  →  prove "c encrypts 0"
        // Simulated branch: vote = 1  →  simulate "c/g encrypts 0"
        // -----------------------------------------------------------------------

        // Real branch: pick witness u, compute a_real = u^n mod n²
        const u = await randomInZn(n);
        const a0 = bigintCryptoUtils.modPow(u, n, nSquared);

        // Simulated branch: pick fake challenge e1 and response z1 freely,
        // then back-compute commitment: a1 = z1^n * (c/g)^(-e1) mod n²
        const e1 = await randomInZn(CHALLENGE_MASK + 1n);
        const z1 = await randomInZn(n);
        const a1 =
            (bigintCryptoUtils.modPow(z1, n, nSquared) *
                bigintCryptoUtils.modInv(
                    bigintCryptoUtils.modPow(c1, e1, nSquared),
                    nSquared
                )) %
            nSquared;

        // Fiat–Shamir: e = H(n, g, ciphertext, a0, a1)
        const e = await fsHash(n, g, ciphertext, a0, a1);

        // Split challenge: e0 = e XOR e1  (or (e - e1) mod 2^CHALLENGE_BITS)
        const e0 = (e ^ e1) & CHALLENGE_MASK;

        // Real response: z0 = u * r^e0 mod n
        const z0 = (u * bigintCryptoUtils.modPow(r, e0, n)) % n;

        proof = { a0: a0.toString(), a1: a1.toString(), e0: e0.toString(), e1: e1.toString(), z0: z0.toString(), z1: z1.toString() };
    } else {
        // -----------------------------------------------------------------------
        // Real branch: vote = 1  →  prove "c/g encrypts 0"
        // Simulated branch: vote = 0  →  simulate "c encrypts 0"
        // -----------------------------------------------------------------------

        // Real branch: pick witness u, compute a_real = u^n mod n²
        const u = await randomInZn(n);
        const a1 = bigintCryptoUtils.modPow(u, n, nSquared);

        // Simulated branch: fake challenge e0, fake response z0,
        // back-compute: a0 = z0^n * c^(-e0) mod n²
        const e0 = await randomInZn(CHALLENGE_MASK + 1n);
        const z0 = await randomInZn(n);
        const a0 =
            (bigintCryptoUtils.modPow(z0, n, nSquared) *
                bigintCryptoUtils.modInv(
                    bigintCryptoUtils.modPow(ciphertext, e0, nSquared),
                    nSquared
                )) %
            nSquared;

        // Fiat–Shamir
        const e = await fsHash(n, g, ciphertext, a0, a1);

        // Split challenge: e1 = e XOR e0
        const e1 = (e ^ e0) & CHALLENGE_MASK;

        // Real response: z1 = u * r^e1 mod n
        const z1 = (u * bigintCryptoUtils.modPow(r, e1, n)) % n;

        proof = { a0: a0.toString(), a1: a1.toString(), e0: e0.toString(), e1: e1.toString(), z0: z0.toString(), z1: z1.toString() };
    }

    return { ciphertext, proof };
}

// ---------------------------------------------------------------------------
// Proof verification
// ---------------------------------------------------------------------------

/**
 * Verify that `ciphertext` encrypts either 0 or 1, given the proof.
 *
 * Checks:
 *  1. e0 XOR e1 == H(n, g, c, a0, a1)          (challenges are consistent)
 *  2. z0^n == a0 * c^e0          mod n²         (branch 0 check)
 *  3. z1^n == a1 * (c/g)^e1      mod n²         (branch 1 check)
 */
export async function verifyBinaryProof(
    publicKey: paillier.PublicKey,
    ciphertext: bigint,
    proof: BinaryZKProofModel
): Promise<boolean> {
    const { n, g, _n2: n2 } = publicKey as any;
    const nSquared: bigint = n2 ?? n * n;
    const { a0: _a0, a1: _a1, e0: _e0, e1: _e1, z0: _z0, z1: _z1 } = proof;

    try {
        // 1. Challenge consistency
        const a0 = BigInt(_a0);
        const a1 = BigInt(_a1);
        const e0 = BigInt(_e0);
        const e1 = BigInt(_e1);
        const z0 = BigInt(_z0);
        const z1 = BigInt(_z1);

        const e = await fsHash(n, g, ciphertext, a0, a1);
        if (((e0 ^ e1) & CHALLENGE_MASK) !== e) {
            console.error("Challenge consistency check failed");
            return false;
        }

        // 2. Branch 0: z0^n ≡ a0 * c^e0  (mod n²)
        const lhs0 = bigintCryptoUtils.modPow(z0, n, nSquared);
        const rhs0 =
            (a0 * bigintCryptoUtils.modPow(ciphertext, e0, nSquared)) % nSquared;
        if (lhs0 !== rhs0) {
            console.error("Branch 0 check failed");
            return false;
        }

        // 3. Branch 1: z1^n ≡ a1 * (c * g^(-1))^e1  (mod n²)
        const gInv = bigintCryptoUtils.modInv(g, nSquared);
        const c1 = (ciphertext * gInv) % nSquared;
        const lhs1 = bigintCryptoUtils.modPow(z1, n, nSquared);
        const rhs1 = (a1 * bigintCryptoUtils.modPow(c1, e1, nSquared)) % nSquared;
        if (lhs1 !== rhs1) {
            console.error("Branch 1 check failed");
            return false;
        }

        return true;
    } catch {
        return false;
    }
}