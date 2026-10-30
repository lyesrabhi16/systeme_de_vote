"""The web client's SDK is generated from openapi.json: it must describe the API as it is."""

import json
import os

from app.config.globals import BASE_DIR
from app.main import APP


def test_openapi_json_is_up_to_date():
    with open(os.path.join(BASE_DIR, "openapi.json")) as f:
        committed = json.load(f)
    assert committed == json.loads(json.dumps(APP.openapi())), (
        "openapi.json is out of date: run `make openapi`, then `bun run generate-API-CLIENT` in SVS-CLIENT"
    )


def test_the_api_lives_under_api_and_documents_every_operation_once():
    schema = APP.openapi()
    assert all(path.startswith("/api/") for path in schema["paths"]), [
        p for p in schema["paths"] if not p.startswith("/api/")
    ]
    operation_ids = [op["operationId"] for item in schema["paths"].values() for op in item.values()]
    assert len(operation_ids) == len(set(operation_ids))
