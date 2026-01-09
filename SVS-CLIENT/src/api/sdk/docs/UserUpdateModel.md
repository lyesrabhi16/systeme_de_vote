# UserUpdateModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**first_name** | **string** |  | [default to undefined]
**last_name** | **string** |  | [default to undefined]
**email** | **string** |  | [default to undefined]
**username** | **string** |  | [default to undefined]
**phone_number** | **string** |  | [default to undefined]
**is_admin** | **boolean** |  | [default to undefined]
**is_active** | **boolean** |  | [default to undefined]
**verified_email** | **boolean** |  | [default to undefined]
**verified_phone_number** | **boolean** |  | [default to undefined]
**password** | **string** |  | [optional] [default to undefined]
**request_reset_password** | **boolean** |  | [optional] [default to false]

## Example

```typescript
import { UserUpdateModel } from './api';

const instance: UserUpdateModel = {
    first_name,
    last_name,
    email,
    username,
    phone_number,
    is_admin,
    is_active,
    verified_email,
    verified_phone_number,
    password,
    request_reset_password,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
