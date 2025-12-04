import type { Vote } from "@/api/sdk";

export enum VoteBadgeType {
    Finished = 'finished',
    Ongoing = 'ongoing',
    Upcoming = 'upcoming',
    FinishedWithoutVoting = 'finished_without_voting',
}

export const getBadgeType = (vote: Vote, userHasVoted?: boolean) => {
    const ongoing =
        new Date(vote.start_date) <= new Date() &&
        new Date(vote.end_date) >= new Date();
    const upcoming = new Date(vote.start_date) > new Date();
    const finished = new Date(vote.end_date) < new Date();
    const finishedWithoutVoting = finished && !userHasVoted;

    if (ongoing) return VoteBadgeType.Ongoing;
    if (upcoming) return VoteBadgeType.Upcoming;
    if (finishedWithoutVoting) return VoteBadgeType.FinishedWithoutVoting;
    return VoteBadgeType.Finished;
};