# BulletinsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getAllBulletins**](#getallbulletins) | **GET** /api/bulletins/ | Get All Bulletins|

# **getAllBulletins**
> PaginatedListResponseBulletin getAllBulletins()


### Example

```typescript
import {
    BulletinsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BulletinsApi(configuration);

let page: number; // (optional) (default to 1)
let perPage: number; // (optional) (default to 10)
let search: string; // (optional) (default to undefined)
let voteId: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.getAllBulletins(
    page,
    perPage,
    search,
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to 1|
| **perPage** | [**number**] |  | (optional) defaults to 10|
| **search** | [**string**] |  | (optional) defaults to undefined|
| **voteId** | [**number**] |  | (optional) defaults to undefined|


### Return type

**PaginatedListResponseBulletin**

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

