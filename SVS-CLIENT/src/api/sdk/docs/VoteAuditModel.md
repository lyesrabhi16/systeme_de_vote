# VoteAuditModel

What anyone needs to check the count of an election with the bulletin board (see app/utils/audit.py).

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**public_key** | **string** |  | [default to undefined]
**counts** | **{ [key: string]: number; }** |  | [default to undefined]
**encrypted_tally** | **{ [key: string]: string; }** |  | [default to undefined]
**tally_proof** | **{ [key: string]: string; }** |  | [default to undefined]

## Example

```typescript
import { VoteAuditModel } from './api';

const instance: VoteAuditModel = {
    public_key,
    counts,
    encrypted_tally,
    tally_proof,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
