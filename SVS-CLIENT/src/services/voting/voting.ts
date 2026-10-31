import apiClient from "@/api/client";
import type { Candidate, VoteResponseModel } from "@/api/sdk";
import { PublicKey as PaillierPublicKey } from "paillier-bigint";
import { buildBallot } from "./paillier_encryption_utils";

/**
 * Encrypts the choice (a candidate, or null for a blank ballot) in the browser, with the proofs the server checks, and sends it.
 * Nothing that identifies the choice leaves the browser: the server and the network only see numbers it cannot read without the
 * private key of the election.
 */
export const castVote = async (vote: Pick<VoteResponseModel, 'id' | 'public_key'>, candidates: Candidate[], choiceId: number | null) => {
    const { n, g } = JSON.parse(vote.public_key);
    const publicKey = new PaillierPublicKey(BigInt(n), BigInt(g));
    const ballot = await buildBallot(
        publicKey,
        candidates.map(candidate => candidate.id as number),
        choiceId,
    );
    return apiClient().vote.castVote(vote.id as number, ballot);
};
