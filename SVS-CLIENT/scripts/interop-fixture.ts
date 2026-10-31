/**
 * Writes SVS-SERVER/app/tests/fixtures/ts_ballots.json: ballots made by the web client, for the server's tests to verify
 * (SVS-SERVER/app/tests/test_interop.py). Only public data goes into it: a public key and ballots.
 *
 *     bun run interop-fixture
 */
import { generateRandomKeys } from "paillier-bigint";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildBallot } from "../src/services/voting/paillier_encryption_utils";

const CANDIDATES = [11, 22, 33];
const { publicKey } = await generateRandomKeys(1024, true);

const fixture = {
    public_key: { n: publicKey.n.toString(), g: publicKey.g.toString() },
    candidate_ids: CANDIDATES,
    honest: await buildBallot(publicKey, CANDIDATES, 33),
    blank: await buildBallot(publicKey, CANDIDATES, null),
};

const path = resolve(import.meta.dirname, "../../SVS-SERVER/app/tests/fixtures/ts_ballots.json");
writeFileSync(path, JSON.stringify(fixture, null, 1) + "\n");
console.log(`written ${path}`);
