# DashboardResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lastFinishedVote** | [**FullVoteResponseModel**](FullVoteResponseModel.md) |  | [optional] [default to undefined]
**upcomingVotes** | [**Array&lt;VoteWithCreatorResponseModel&gt;**](VoteWithCreatorResponseModel.md) |  | [optional] [default to undefined]
**ongoingVotes** | [**Array&lt;VoteWithCreatorResponseModel&gt;**](VoteWithCreatorResponseModel.md) |  | [optional] [default to undefined]
**participationData** | [**ParticipationDataResponseModel**](ParticipationDataResponseModel.md) |  | [optional] [default to undefined]
**votesPerMonth** | [**Array&lt;VotesPerMonthResponseModel&gt;**](VotesPerMonthResponseModel.md) |  | [optional] [default to undefined]
**votesStatusPerMonth** | [**Array&lt;VoteStatusPerMonthResponseModel&gt;**](VoteStatusPerMonthResponseModel.md) |  | [optional] [default to undefined]
**userGrowthPerMonth** | [**Array&lt;UserGrowthPerMonthResponseModel&gt;**](UserGrowthPerMonthResponseModel.md) |  | [optional] [default to undefined]
**userRoleRepartition** | **{ [key: string]: number; }** |  | [optional] [default to undefined]
**userActivityRepartition** | **{ [key: string]: number; }** |  | [optional] [default to undefined]
**nbr_users** | **number** |  | [optional] [default to undefined]
**nbr_admins** | **number** |  | [optional] [default to undefined]
**nbr_inscription_authority** | **number** |  | [optional] [default to undefined]
**nbr_vote_authority** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { DashboardResponseModel } from './api';

const instance: DashboardResponseModel = {
    lastFinishedVote,
    upcomingVotes,
    ongoingVotes,
    participationData,
    votesPerMonth,
    votesStatusPerMonth,
    userGrowthPerMonth,
    userRoleRepartition,
    userActivityRepartition,
    nbr_users,
    nbr_admins,
    nbr_inscription_authority,
    nbr_vote_authority,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
