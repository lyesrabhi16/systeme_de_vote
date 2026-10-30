# VoteApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**castVote**](#castvote) | **POST** /api/vote/cast/{vote_id} | Cast Vote|
|[**checkIfUserVotedOnVote**](#checkifuservotedonvote) | **POST** /api/vote/check/{vote_id}/user-voted | Check If User Voted On Vote|
|[**createVote**](#createvote) | **POST** /api/vote/ | Create Vote|
|[**deleteVote**](#deletevote) | **DELETE** /api/vote/{vote_id}/ | Delete Vote|
|[**getAllVotes**](#getallvotes) | **GET** /api/vote/ | Get All Votes|
|[**getAlreadyVotedOnVotes**](#getalreadyvotedonvotes) | **GET** /api/vote/voted | Get Already Voted On Votes|
|[**getAttributedVotes**](#getattributedvotes) | **GET** /api/vote/attributed | Get Attributed Votes|
|[**getAvailableVotes**](#getavailablevotes) | **GET** /api/vote/available | Get Available Votes|
|[**getCreatedVotes**](#getcreatedvotes) | **GET** /api/vote/created | Get Created Votes|
|[**getFinishedVotes**](#getfinishedvotes) | **GET** /api/vote/finishedVotes | Get Finished Votes|
|[**getVoteAudit**](#getvoteaudit) | **GET** /api/vote/audit/{vote_id}/ | Get Vote Audit|
|[**getVoteBulletins**](#getvotebulletins) | **GET** /api/vote/bulletins/{vote_id}/ | Get Public Vote Bulletins|
|[**getVoteById**](#getvotebyid) | **GET** /api/vote/{vote_id}/ | Get Vote By Id|
|[**getVoteCount**](#getvotecount) | **GET** /api/vote/count/{vote_id}/ | Get Vote Count|
|[**getVoteResult**](#getvoteresult) | **GET** /api/vote/result/{vote_id}/ | Get Vote Result|
|[**updateVote**](#updatevote) | **PUT** /api/vote/{vote_id}/ | Update Vote|

# **castVote**
> VoteCastResponseModel castVote(voteCastData)


### Example

```typescript
import {
    VoteApi,
    Configuration,
    VoteCastData
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)
let voteCastData: VoteCastData; //

const { status, data } = await apiInstance.castVote(
    voteId,
    voteCastData
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteCastData** | **VoteCastData**|  | |
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**VoteCastResponseModel**

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

# **checkIfUserVotedOnVote**
> BooleanResponse checkIfUserVotedOnVote(requiredTokenInput)


### Example

```typescript
import {
    VoteApi,
    Configuration,
    RequiredTokenInput
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)
let requiredTokenInput: RequiredTokenInput; //

const { status, data } = await apiInstance.checkIfUserVotedOnVote(
    voteId,
    requiredTokenInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **requiredTokenInput** | **RequiredTokenInput**|  | |
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**BooleanResponse**

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

# **createVote**
> FullVoteResponseModel createVote(voteCreationModel)


### Example

```typescript
import {
    VoteApi,
    Configuration,
    VoteCreationModel
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteCreationModel: VoteCreationModel; //

const { status, data } = await apiInstance.createVote(
    voteCreationModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteCreationModel** | **VoteCreationModel**|  | |


### Return type

**FullVoteResponseModel**

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

# **deleteVote**
> MessageResponse deleteVote()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)

const { status, data } = await apiInstance.deleteVote(
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|


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
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllVotes**
> PaginatedListResponseVoteResponseModel getAllVotes()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let page: number; // (optional) (default to 1)
let perPage: number; // (optional) (default to 10)
let search: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.getAllVotes(
    page,
    perPage,
    search
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to 1|
| **perPage** | [**number**] |  | (optional) defaults to 10|
| **search** | [**string**] |  | (optional) defaults to undefined|


### Return type

**PaginatedListResponseVoteResponseModel**

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

# **getAlreadyVotedOnVotes**
> Array<VoteResponseModel> getAlreadyVotedOnVotes()


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

**Array<VoteResponseModel>**

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
> Array<VoteResponseModel> getAttributedVotes()


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

**Array<VoteResponseModel>**

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
> Array<VoteResponseModel> getAvailableVotes()


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

**Array<VoteResponseModel>**

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
> Array<VoteResponseModel> getCreatedVotes()


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

**Array<VoteResponseModel>**

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

# **getVoteAudit**
> VoteAuditModel getVoteAudit()

What is needed to check the count of a finished election against the bulletin board. Public, like the board.

### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)

const { status, data } = await apiInstance.getVoteAudit(
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**VoteAuditModel**

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

# **getVoteBulletins**
> PaginatedListResponseBulletin getVoteBulletins()

The bulletin board: every ballot of the election, public, so that anyone can check them (see app/utils/audit.py).

### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)
let page: number; // (optional) (default to 1)
let itemsPerPage: number; // (optional) (default to 10)

const { status, data } = await apiInstance.getVoteBulletins(
    voteId,
    page,
    itemsPerPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **itemsPerPage** | [**number**] |  | (optional) defaults to 10|


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

# **getVoteById**
> FullVoteResponseModel getVoteById()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)

const { status, data } = await apiInstance.getVoteById(
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**FullVoteResponseModel**

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

# **getVoteCount**
> VoteResultsModel getVoteCount()

Counts an election that is finished (the cron does it too, every minute): the same result each time.

### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)

const { status, data } = await apiInstance.getVoteCount(
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**VoteResultsModel**

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

# **getVoteResult**
> FinishedVoteResponseModel getVoteResult()


### Example

```typescript
import {
    VoteApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)

const { status, data } = await apiInstance.getVoteResult(
    voteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**FinishedVoteResponseModel**

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

# **updateVote**
> FullVoteResponseModel updateVote(voteUpdateModel)


### Example

```typescript
import {
    VoteApi,
    Configuration,
    VoteUpdateModel
} from './api';

const configuration = new Configuration();
const apiInstance = new VoteApi(configuration);

let voteId: number; // (default to undefined)
let voteUpdateModel: VoteUpdateModel; //

const { status, data } = await apiInstance.updateVote(
    voteId,
    voteUpdateModel
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **voteUpdateModel** | **VoteUpdateModel**|  | |
| **voteId** | [**number**] |  | defaults to undefined|


### Return type

**FullVoteResponseModel**

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

