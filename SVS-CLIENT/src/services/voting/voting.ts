import apiClient from "@/api/client";
import type { Candidate, Vote, VoteCastData } from "@/api/sdk";
import { PublicKey as PaillierPublicKey } from "paillier-bigint";
import { encryptWithBinaryProof } from "./paillier_encryption_utils";


export const encrypt_choice = (publicKey: PaillierPublicKey, choice: number): bigint => {
    const encryptedChoice = publicKey.encrypt(BigInt(choice));
    return encryptedChoice;
}

export const castVote = async (vote: Vote, candidates: Candidate[], choiceId: number) => {
    try {
        //console.log("publicKey str: ", vote.public_key);
        const publicKeyJson = JSON.parse(vote.public_key);
        //console.log("Public key retrieved from vote data:", publicKeyJson);
        const publicKey = new PaillierPublicKey(BigInt(publicKeyJson['n']), BigInt(publicKeyJson['g']));
        //console.log("Public key object created:", publicKey);
        const encryptedChoice: VoteCastData = { content: [] };
        for (const candidate of candidates) {
            const data = await encryptWithBinaryProof(publicKey, candidate.id as number === choiceId ? 1n : 0n);

            encryptedChoice.content.push(
                {
                    candidate_id: candidate.id as number,
                    encrypted_value: data.ciphertext.toString(),
                    proof: data.proof,
                }
            );
        }
        //console.log("Encrypted choice ready to be sent to the server:", encryptedChoice);
        const result = await apiClient().vote.castVote(vote.id as number, encryptedChoice);
        //console.log("Vote cast successfully:", result.data);
        return result;
    } catch (error) {
        console.error("Error casting vote:", error);
        throw error;
    }
}

