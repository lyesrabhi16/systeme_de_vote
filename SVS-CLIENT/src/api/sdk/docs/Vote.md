# Vote


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**title** | **string** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**start_date** | **string** |  | [default to undefined]
**end_date** | **string** |  | [default to undefined]
**public_key** | **string** | The public key used for vote encryption generated automatically when the vote is created | [default to undefined]
**encrypted_private_key** | **string** | The private key encrypted with the system\&#39;s master key | [default to undefined]
**has_been_counted** | **boolean** | Indicates if the vote has been counted | [optional] [default to false]
**encrypted_tally** | **string** |  | [optional] [default to undefined]
**tally_proof** | **string** |  | [optional] [default to undefined]
**creator_id** | **number** |  | [default to undefined]

## Example

```typescript
import { Vote } from './api';

const instance: Vote = {
    id,
    title,
    description,
    start_date,
    end_date,
    public_key,
    encrypted_private_key,
    has_been_counted,
    encrypted_tally,
    tally_proof,
    creator_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
