# VoteApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getAlreadyVotedOnVotes**](#getalreadyvotedonvotes) | **GET** /vote/voted | Get Already Voted On Votes|
|[**getAttributedVotes**](#getattributedvotes) | **GET** /vote/attributed | Get Attributed Votes|
|[**getAvailableVotes**](#getavailablevotes) | **GET** /vote/available | Get Available Votes|
|[**getCreatedVotes**](#getcreatedvotes) | **GET** /vote/created | Get Created Votes|
|[**getFinishedVotes**](#getfinishedvotes) | **GET** /vote/finishedVotes | Get Finished Votes|

# **getAlreadyVotedOnVotes**
> Array<Vote> getAlreadyVotedOnVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

const { status, data } = await apiInstance.getAlreadyVotedOnVotes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Vote>**

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

# **getAttributedVotes**
> Array<Vote> getAttributedVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

const { status, data } = await apiInstance.getAttributedVotes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Vote>**

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

# **getAvailableVotes**
> Array<Vote> getAvailableVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

const { status, data } = await apiInstance.getAvailableVotes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Vote>**

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

# **getCreatedVotes**
> Array<Vote> getCreatedVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

const { status, data } = await apiInstance.getCreatedVotes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Vote>**

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

# **getFinishedVotes**
> Array<FinishedVoteResponseModel> getFinishedVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

const { status, data } = await apiInstance.getFinishedVotes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<FinishedVoteResponseModel>**

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

