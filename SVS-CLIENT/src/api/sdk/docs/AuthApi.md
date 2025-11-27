# AuthApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCurrentUser**](#getcurrentuser) | **POST** /auth/user/me | Get Current User|
|[**login**](#login) | **POST** /auth/login | Login|
|[**logout**](#logout) | **POST** /auth/logout | Logout|
|[**passwordResetRequest**](#passwordresetrequest) | **POST** /auth/password-reset | Password Reset Request|
|[**resendOtp**](#resendotp) | **POST** /auth/resend-otp | Resend Otp|
|[**validatePasswordReset**](#validatepasswordreset) | **POST** /auth/password-reset/validate | Validate Password Reset Otp|
|[**verifyOTP**](#verifyotp) | **POST** /auth/verify-otp | Verify Otp|

# **getCurrentUser**
> CurrentUserResponseModel getCurrentUser(tokenInput)

Get the current user information

### Example

```typescript
import {
    AuthApi,
    Configuration,
    TokenInput
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let tokenInput: TokenInput; //

const { status, data } = await apiInstance.getCurrentUser(
    tokenInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **tokenInput** | **TokenInput**|  | |


### Return type

**CurrentUserResponseModel**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login**
> SuccessfulUserLoginResponseModel login(userLoginModel)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    UserLoginModel
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let userLoginModel: UserLoginModel; //

const { status, data } = await apiInstance.login(
    userLoginModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userLoginModel** | **UserLoginModel**|  | |


### Return type

**SuccessfulUserLoginResponseModel**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout**
> MessageResponse logout()


### Example

```typescript
import {
    AuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

const { status, data } = await apiInstance.logout();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**MessageResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **passwordResetRequest**
> MessageResponse passwordResetRequest(passwordResetRequestModel)

Request password reset by sending OTP to user email

### Example

```typescript
import {
    AuthApi,
    Configuration,
    PasswordResetRequestModel
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let passwordResetRequestModel: PasswordResetRequestModel; //

const { status, data } = await apiInstance.passwordResetRequest(
    passwordResetRequestModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **passwordResetRequestModel** | **PasswordResetRequestModel**|  | |


### Return type

**MessageResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **resendOtp**
> MessageResponse resendOtp(oTPResendRequestModel)

Resend OTP to user email

### Example

```typescript
import {
    AuthApi,
    Configuration,
    OTPResendRequestModel
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let oTPResendRequestModel: OTPResendRequestModel; //

const { status, data } = await apiInstance.resendOtp(
    oTPResendRequestModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **oTPResendRequestModel** | **OTPResendRequestModel**|  | |


### Return type

**MessageResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validatePasswordReset**
> MessageResponse validatePasswordReset(passwordResetOTPModel)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    PasswordResetOTPModel
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let passwordResetOTPModel: PasswordResetOTPModel; //

const { status, data } = await apiInstance.validatePasswordReset(
    passwordResetOTPModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **passwordResetOTPModel** | **PasswordResetOTPModel**|  | |


### Return type

**MessageResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **verifyOTP**
> TokenResponse verifyOTP(oTPVerificationModel)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    OTPVerificationModel
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let oTPVerificationModel: OTPVerificationModel; //

const { status, data } = await apiInstance.verifyOTP(
    oTPVerificationModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **oTPVerificationModel** | **OTPVerificationModel**|  | |


### Return type

**TokenResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

