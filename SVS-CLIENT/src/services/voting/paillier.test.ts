// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateRandomKeys, PublicKey } from "paillier-bigint";
import { describe, expect, it } from "vitest";
import type { VoteCastData } from "@api/sdk";
import { buildBallot, encryptBit, fsHash, proveBinary, verifyBinaryProof } from "./paillier_encryption_utils";

const fixture = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../../../../SVS-SERVER/app/tests/fixtures/python_ballots.json"), "utf8"),
);

const keyOf = (k: { n: string; g: string }) => new PublicKey(BigInt(k.n), BigInt(k.g));

/** What the server checks of a ballot: every entry, then the sum. */
const ballotIsValid = async (publicKey: PublicKey, candidateIds: number[], ballot: VoteCastData) => {
    const n2 = publicKey.n * publicKey.n;
    if (ballot.content.map(e => e.candidate_id).join() !== candidateIds.join()) return false;
    let product = 1n;
    for (const entry of ballot.content) {
        const c = BigInt(entry.encrypted_value);
        if (!(await verifyBinaryProof(publicKey, c, entry.proof))) return false;
        product = (product * c) % n2;
    }
    return verifyBinaryProof(publicKey, product, ballot.sum_proof);
};

describe("a ballot made here", async () => {
    const { publicKey, privateKey } = await generateRandomKeys(1024, true);
    const ids = [1, 2, 3];

    it("verifies, and decrypts to the choice", async () => {
        const ballot = await buildBallot(publicKey, ids, 2);
        expect(await ballotIsValid(publicKey, ids, ballot)).toBe(true);
        const plaintexts = ballot.content.map(e => privateKey.decrypt(BigInt(e.encrypted_value)));
        expect(plaintexts).toEqual([0n, 1n, 0n]);
    });

    it("may be blank", async () => {
        const ballot = await buildBallot(publicKey, ids, null);
        expect(await ballotIsValid(publicKey, ids, ballot)).toBe(true);
        expect(ballot.content.map(e => privateKey.decrypt(BigInt(e.encrypted_value)))).toEqual([0n, 0n, 0n]);
    });

    it("refuses a choice that is not a candidate", async () => {
        await expect(buildBallot(publicKey, ids, 9)).rejects.toThrow();
    });

    it("looks different each time for the same choice", async () => {
        const [a, b] = [await buildBallot(publicKey, ids, 1), await buildBallot(publicKey, ids, 1)];
        expect(a.content[0].encrypted_value).not.toEqual(b.content[0].encrypted_value);
    });

    it("has proofs that are for one ciphertext only", async () => {
        const { ciphertext, r } = encryptBit(publicKey, 1n);
        const proof = await proveBinary(publicKey, ciphertext, 1n, r);
        expect(await verifyBinaryProof(publicKey, ciphertext, proof)).toBe(true);
        expect(await verifyBinaryProof(publicKey, encryptBit(publicKey, 1n).ciphertext, proof)).toBe(false);
    });

    it("cannot prove that a 2 is a 0 or a 1", async () => {
        const n2 = publicKey.n * publicKey.n;
        const [one, other] = [encryptBit(publicKey, 1n), encryptBit(publicKey, 1n)];
        const two = (one.ciphertext * other.ciphertext) % n2;
        const forged = await proveBinary(publicKey, two, 1n, (one.r * other.r) % publicKey.n);
        expect(await verifyBinaryProof(publicKey, two, forged)).toBe(false);
    });

    it("has a challenge bound to the width of the key", async () => {
        const a = await fsHash(publicKey.n, [1n, 2n, 3n]);
        const b = await fsHash(publicKey.n, [1n, 2n, 3n]);
        expect(a).toEqual(b);
        expect(a < 1n << 128n).toBe(true);
    });
});

describe("what the Python voter made", () => {
    const publicKey = keyOf(fixture.public_key);
    const ids: number[] = fixture.candidate_ids;

    it("hashes exactly as the server does", async () => {
        for (const v of fixture.fs_hash_vectors) {
            expect((await fsHash(BigInt(v.n), v.values.map((x: string) => BigInt(x)))).toString()).toEqual(v.expected);
        }
    });

    it("verifies: an honest ballot, and a blank one", async () => {
        expect(await ballotIsValid(publicKey, ids, fixture.honest)).toBe(true);
        expect(await ballotIsValid(publicKey, ids, fixture.blank)).toBe(true);
    });

    it("does not verify when a ciphertext was changed", async () => {
        expect(await ballotIsValid(publicKey, ids, fixture.changed_ciphertext)).toBe(false);
    });

    it("does not verify when several candidates are chosen", async () => {
        const ballot: VoteCastData = fixture.several_candidates;
        // every entry is a proven 0 or 1 ...
        for (const entry of ballot.content) {
            expect(await verifyBinaryProof(publicKey, BigInt(entry.encrypted_value), entry.proof)).toBe(true);
        }
        // ... and the ballot is refused because of the sum
        expect(await ballotIsValid(publicKey, ids, ballot)).toBe(false);
    });
});
