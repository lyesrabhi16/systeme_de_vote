# Bulletin


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**vote_id** | **number** |  | [optional] [default to undefined]
**content** | **string** | Homomorphically encrypted ballot | [default to undefined]
**date** | **string** |  | [default to undefined]
**voting_token** | **string** | Unblinded anonymous voting token | [default to undefined]
**token_signature** | **string** | Authority signature over voting token | [default to undefined]

## Example

```typescript
import { Bulletin } from './api';

const instance: Bulletin = {
    id,
    vote_id,
    content,
    date,
    voting_token,
    token_signature,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
