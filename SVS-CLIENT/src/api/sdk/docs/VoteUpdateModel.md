# VoteUpdateModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **string** |  | [optional] [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**start_date** | **string** |  | [optional] [default to undefined]
**end_date** | **string** |  | [optional] [default to undefined]
**candidates** | [**Array&lt;CandidateCreateModel&gt;**](CandidateCreateModel.md) |  | [optional] [default to undefined]
**public_key** | **string** |  | [optional] [default to undefined]
**private_key** | **string** |  | [optional] [default to undefined]
**open_to_all** | **boolean** |  | [optional] [default to undefined]
**attributed_user_ids** | **Array&lt;number&gt;** |  | [optional] [default to undefined]
**excluded_user_ids** | **Array&lt;number&gt;** |  | [optional] [default to undefined]

## Example

```typescript
import { VoteUpdateModel } from './api';

const instance: VoteUpdateModel = {
    title,
    description,
    start_date,
    end_date,
    candidates,
    public_key,
    private_key,
    open_to_all,
    attributed_user_ids,
    excluded_user_ids,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
