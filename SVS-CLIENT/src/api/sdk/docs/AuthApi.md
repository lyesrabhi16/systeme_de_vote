# AuthApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCurrentUser**](#getcurrentuser) | **POST** /auth/user/me | Get Current User|
|[**login**](#login) | **POST** /auth/login | Login|
|[**logout**](#logout) | **POST** /auth/logout | Logout|

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
> TokenResponse login(userLoginModel)


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

