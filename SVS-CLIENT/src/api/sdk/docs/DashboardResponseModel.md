# DashboardResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lastFinishedVote** | [**FullVoteResponseModel**](FullVoteResponseModel.md) |  | [default to undefined]
**upcomingVotes** | [**Array&lt;VoteWithCreatorResponseModel&gt;**](VoteWithCreatorResponseModel.md) |  | [default to undefined]
**ongoingVotes** | [**Array&lt;VoteWithCreatorResponseModel&gt;**](VoteWithCreatorResponseModel.md) |  | [default to undefined]
**participationData** | [**ParticipationDataResponseModel**](ParticipationDataResponseModel.md) |  | [default to undefined]
**votesPerMonth** | [**Array&lt;VotesPerMonthResponseModel&gt;**](VotesPerMonthResponseModel.md) |  | [default to undefined]
**userGrowthPerMonth** | [**Array&lt;UserGrowthPerMonthResponseModel&gt;**](UserGrowthPerMonthResponseModel.md) |  | [default to undefined]
**votesStatusPerMonth** | [**Array&lt;VoteStatusPerMonthResponseModel&gt;**](VoteStatusPerMonthResponseModel.md) |  | [default to undefined]

## Example

```typescript
import { DashboardResponseModel } from './api';

const instance: DashboardResponseModel = {
    lastFinishedVote,
    upcomingVotes,
    ongoingVotes,
    participationData,
    votesPerMonth,
    userGrowthPerMonth,
    votesStatusPerMonth,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
