# FinishedVoteResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**vote** | [**Vote**](Vote.md) |  | [default to undefined]
**total_bulletins** | **number** |  | [default to undefined]
**candidate_results** | **{ [key: string]: number; }** |  | [default to undefined]
**abstention_count** | **number** |  | [default to undefined]
**voter_count** | **number** |  | [default to undefined]
**user_has_voted** | **boolean** |  | [default to undefined]

## Example

```typescript
import { FinishedVoteResponseModel } from './api';

const instance: FinishedVoteResponseModel = {
    vote,
    total_bulletins,
    candidate_results,
    abstention_count,
    voter_count,
    user_has_voted,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
