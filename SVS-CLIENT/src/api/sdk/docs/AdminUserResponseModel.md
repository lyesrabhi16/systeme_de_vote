# AdminUserResponseModel

What the administrators of the users see of an account (never the password hash).

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**first_name** | **string** |  | [default to undefined]
**last_name** | **string** |  | [default to undefined]
**email** | **string** |  | [default to undefined]
**username** | **string** |  | [default to undefined]
**phone_number** | **string** |  | [default to undefined]
**is_active** | **boolean** |  | [default to undefined]
**is_admin** | **boolean** |  | [default to undefined]
**authority** | **string** |  | [optional] [default to undefined]
**verified_email** | **boolean** |  | [default to undefined]
**verified_phone_number** | **boolean** |  | [default to undefined]
**requested_password_reset** | **boolean** |  | [default to undefined]
**created_at** | **string** |  | [default to undefined]

## Example

```typescript
import { AdminUserResponseModel } from './api';

const instance: AdminUserResponseModel = {
    id,
    first_name,
    last_name,
    email,
    username,
    phone_number,
    is_active,
    is_admin,
    authority,
    verified_email,
    verified_phone_number,
    requested_password_reset,
    created_at,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
