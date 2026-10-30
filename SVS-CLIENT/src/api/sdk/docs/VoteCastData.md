# VoteCastData

A ballot: for each candidate, an encryption of 0 or 1 with the proof that it is one of the two, and a proof that the sum of all of them (the product of the ciphertexts) is 0 or 1 too: at most one candidate. Without that second proof, a voter could encrypt a 1 for every candidate, and each one would pass.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**content** | [**Array&lt;VoteCastContentModel&gt;**](VoteCastContentModel.md) |  | [default to undefined]
**sum_proof** | [**BinaryZKProofModel**](BinaryZKProofModel.md) |  | [default to undefined]

## Example

```typescript
import { VoteCastData } from './api';

const instance: VoteCastData = {
    content,
    sum_proof,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
