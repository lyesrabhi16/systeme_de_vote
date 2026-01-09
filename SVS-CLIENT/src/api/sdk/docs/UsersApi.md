# UsersApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminDeleteUser**](#admindeleteuser) | **DELETE** /users/admin/:id | Admin Delete User|
|[**adminGetAllUsers**](#admingetallusers) | **GET** /users/admin/all | Admin Get All Users|
|[**adminGetUserById**](#admingetuserbyid) | **GET** /users/admin/:id | Admin Get User By Id|
|[**adminUpdateUser**](#adminupdateuser) | **PUT** /users/admin/:id | Admin Update User|
|[**createUser**](#createuser) | **POST** /users/ | Create User|
|[**getUserById**](#getuserbyid) | **GET** /users/:id | Get User By Id|

# **adminDeleteUser**
> { [key: string]: any; } adminDeleteUser()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.adminDeleteUser(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminGetAllUsers**
> Array<UserResponseModel> adminGetAllUsers()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.adminGetAllUsers();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<UserResponseModel>**

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

# **adminGetUserById**
> User adminGetUserById()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.adminGetUserById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**User**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUpdateUser**
> User adminUpdateUser(userUpdateModel)


### Example

```typescript
import {
    UsersApi,
    Configuration,
    UserUpdateModel
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: number; // (default to undefined)
let userUpdateModel: UserUpdateModel; //

const { status, data } = await apiInstance.adminUpdateUser(
    id,
    userUpdateModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userUpdateModel** | **UserUpdateModel**|  | |
| **id** | [**number**] |  | defaults to undefined|


### Return type

**User**

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

# **createUser**
> UserResponseModel createUser(userCreationModel)


### Example

```typescript
import {
    UsersApi,
    Configuration,
    UserCreationModel
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let userCreationModel: UserCreationModel; //

const { status, data } = await apiInstance.createUser(
    userCreationModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userCreationModel** | **UserCreationModel**|  | |


### Return type

**UserResponseModel**

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

# **getUserById**
> UserResponseModel getUserById()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.getUserById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**UserResponseModel**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

