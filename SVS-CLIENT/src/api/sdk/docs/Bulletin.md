# Bulletin


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**vote_id** | **number** |  | [optional] [default to undefined]
**content** | **string** | Homomorphically encrypted ballot, with its proofs (JSON) | [default to undefined]
**date** | **string** |  | [default to undefined]
**unique_code** | **string** | Unique code for the bulletin, used for verification | [optional] [default to undefined]

## Example

```typescript
import { Bulletin } from './api';

const instance: Bulletin = {
    id,
    vote_id,
    content,
    date,
    unique_code,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
