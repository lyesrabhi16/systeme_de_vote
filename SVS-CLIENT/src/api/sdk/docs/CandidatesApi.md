# CandidatesApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCandidateById**](#getcandidatebyid) | **GET** /candidates/id | Get Candidate By Id|

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

