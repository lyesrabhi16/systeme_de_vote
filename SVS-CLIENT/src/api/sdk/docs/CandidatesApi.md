# CandidatesApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createCandidate**](#createcandidate) | **POST** /candidates/ | Create Candidate|
|[**deleteCandidate**](#deletecandidate) | **DELETE** /candidates/ | Delete Candidate|
|[**getCandidateById**](#getcandidatebyid) | **GET** /candidates/ | Get Candidate By Id|
|[**updateCandidate**](#updatecandidate) | **PUT** /candidates/ | Update Candidate|

# **createCandidate**
> Candidate createCandidate(candidateCreateModel)


### Example

```typescript
import {
    CandidatesApi,
    Configuration,
    CandidateCreateModel
} from './api';

const configuration = new Configuration();
const apiInstance = new CandidatesApi(configuration);

let candidateCreateModel: CandidateCreateModel; //

const { status, data } = await apiInstance.createCandidate(
    candidateCreateModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **candidateCreateModel** | **CandidateCreateModel**|  | |


### Return type

**Candidate**

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

# **deleteCandidate**
> any deleteCandidate()


### Example

```typescript
import {
    CandidatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CandidatesApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.deleteCandidate(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**any**

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

# **getCandidateById**
> Candidate getCandidateById()


### Example

```typescript
import {
    CandidatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CandidatesApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.getCandidateById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**Candidate**

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

# **updateCandidate**
> Candidate updateCandidate(candidateUpdateModel)


### Example

```typescript
import {
    CandidatesApi,
    Configuration,
    CandidateUpdateModel
} from './api';

const configuration = new Configuration();
const apiInstance = new CandidatesApi(configuration);

let id: number; // (default to undefined)
let candidateUpdateModel: CandidateUpdateModel; //

const { status, data } = await apiInstance.updateCandidate(
    id,
    candidateUpdateModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **candidateUpdateModel** | **CandidateUpdateModel**|  | |
| **id** | [**number**] |  | defaults to undefined|


### Return type

**Candidate**

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

