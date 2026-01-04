# VoteResultsModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**candidate_results** | **{ [key: string]: number; }** |  | [default to undefined]
**count_failures** | [**Array&lt;Bulletin&gt;**](Bulletin.md) |  | [default to undefined]
**abstention_count** | **number** |  | [default to undefined]
**voter_count** | **number** |  | [default to undefined]

## Example

```typescript
import { VoteResultsModel } from './api';

const instance: VoteResultsModel = {
    candidate_results,
    count_failures,
    abstention_count,
    voter_count,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
