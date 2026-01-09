# User


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**first_name** | **string** |  | [default to undefined]
**last_name** | **string** |  | [default to undefined]
**email** | **string** |  | [default to undefined]
**verified_email** | **boolean** |  | [optional] [default to false]
**username** | **string** |  | [default to undefined]
**password** | **string** |  | [optional] [default to undefined]
**phone_number** | **string** |  | [default to undefined]
**verified_phone_number** | **boolean** |  | [optional] [default to false]
**is_active** | **boolean** |  | [optional] [default to true]
**is_admin** | **boolean** |  | [default to undefined]

## Example

```typescript
import { User } from './api';

const instance: User = {
    id,
    first_name,
    last_name,
    email,
    verified_email,
    username,
    password,
    phone_number,
    verified_phone_number,
    is_active,
    is_admin,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
