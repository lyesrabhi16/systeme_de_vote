# BinaryZKProofModel

A non-interactive zero-knowledge proof (Cramer–Damgård–Schoenmakers OR proof, Fiat–Shamir) that a Paillier ciphertext encrypts 0 or 1, without saying which. Numbers are decimal strings, because they do not fit a JSON number.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**a0** | **string** |  | [default to undefined]
**a1** | **string** |  | [default to undefined]
**e0** | **string** |  | [default to undefined]
**e1** | **string** |  | [default to undefined]
**z0** | **string** |  | [default to undefined]
**z1** | **string** |  | [default to undefined]

## Example

```typescript
import { BinaryZKProofModel } from './api';

const instance: BinaryZKProofModel = {
    a0,
    a1,
    e0,
    e1,
    z0,
    z1,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
