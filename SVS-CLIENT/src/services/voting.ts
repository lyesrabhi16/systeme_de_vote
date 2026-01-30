import apiClient from "@/api/client";
import type { BlindSignatureResponseModel, CurrentUserResponseModel, Vote } from "@/api/sdk";


const generateVoteToken = async (user: CurrentUserResponseModel, voteId: string): Promise<string> => {
    // hash user_unique_hash + voteId using sha256
    // Bun provides Web Crypto
    const message = `${user.unique_hash}::${voteId}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert to hex
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}

const blindToken = async (token: string): Promise<string> => {
    // Use Web Crypto to blind the token
    const encoder = new TextEncoder();
    const data = encoder.encode(token + "::BLINDING_FACTOR");

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert to hex
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}

const unblindToken = async (blindedToken: string): Promise<string> => {
    // Use Web Crypto to unblind the token
    const encoder = new TextEncoder();
    const data = encoder.encode(blindedToken + "::UNBLINDING_FACTOR");

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert to hex
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}


const requestBlindSignature = async (user: CurrentUserResponseModel, voteId: number): Promise<BlindSignatureResponseModel> => {
    const resp = await apiClient().vote.requestBlindSignature(voteId, {
        blinded_message: await blindToken(await generateVoteToken(user, voteId.toString()))
    }).catch(error => {
        console.error("Error requesting blind signature:", error);
        throw error;
    });
    return resp.data;
}

const checkIfUserHasVoted = async (user: CurrentUserResponseModel, voteId: number): Promise<boolean> => {
    const token = await generateVoteToken(user, voteId.toString());
    try {
        const resp = await apiClient().vote.checkIfUserVotedOnVote(voteId, {
            token: token
        });
        return resp.data.result;
    } catch (error) {
        console.error("Error checking if user has voted:", error);
        throw error;
    }
}

const castVote = async (vote: Vote, choiceId: number, signature: string, token: string): Promise<void> => {
    try {
        const encryptedChoice = 
        await apiClient().vote.castVote(vote.id as number, {
            content: choiceId + "",
            signature: signature,
            token: token
        });
    } catch (error) {
        console.error("Error casting vote:", error);
        throw error;
    }
}




export { generateVoteToken, blindToken, unblindToken, requestBlindSignature, checkIfUserHasVoted };