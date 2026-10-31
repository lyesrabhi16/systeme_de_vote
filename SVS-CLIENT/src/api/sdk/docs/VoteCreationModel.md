# VoteCreationModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **string** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**start_date** | **string** |  | [default to undefined]
**end_date** | **string** |  | [default to undefined]
**candidates** | [**Array&lt;CandidateCreateModel&gt;**](CandidateCreateModel.md) |  | [default to undefined]
**open_to_all** | **boolean** |  | [optional] [default to false]
**attributed_user_ids** | **Array&lt;number&gt;** |  | [optional] [default to undefined]
**excluded_user_ids** | **Array&lt;number&gt;** |  | [optional] [default to undefined]

## Example

```typescript
import { VoteCreationModel } from './api';

const instance: VoteCreationModel = {
    title,
    description,
    start_date,
    end_date,
    candidates,
    open_to_all,
    attributed_user_ids,
    excluded_user_ids,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
