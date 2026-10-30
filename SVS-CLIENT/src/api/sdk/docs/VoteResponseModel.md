# VoteResponseModel

An election as the API shows it. The table model must never be a response: it holds the encrypted private key of the election (and would hold anything added to the table later).

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**title** | **string** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**start_date** | **string** |  | [default to undefined]
**end_date** | **string** |  | [default to undefined]
**has_been_counted** | **boolean** |  | [default to undefined]
**public_key** | **string** |  | [default to undefined]
**creator_id** | **number** |  | [default to undefined]

## Example

```typescript
import { VoteResponseModel } from './api';

const instance: VoteResponseModel = {
    id,
    title,
    description,
    start_date,
    end_date,
    has_been_counted,
    public_key,
    creator_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
