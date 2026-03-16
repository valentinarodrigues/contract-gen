"""
GET /contracts
Returns a list of all contracts (excluding analysis records).
"""
import sys
sys.path.insert(0, "/opt/python")

from storage import dynamo_client
from utils.response import ok, error, options_response


def lambda_handler(event: dict, context) -> dict:
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return options_response()

    try:
        return handle_list(event)
    except Exception as e:
        print(f"List error: {e}")
        return error("Failed to list contracts", 500, str(e))


def handle_list(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    status_filter = params.get("status")
    limit = min(int(params.get("limit", 50)), 100)

    if status_filter:
        items = dynamo_client.list_by_status(status_filter, limit)
    else:
        items = dynamo_client.list_all(limit)

    # Filter out analysis records and return contract summaries
    contracts = [
        _to_summary(item)
        for item in items
        if item.get("version") != "analysis"
    ]

    return ok({
        "contracts": contracts,
        "count": len(contracts),
    })


def _to_summary(item: dict) -> dict:
    return {
        "contractId": item.get("contractId", ""),
        "title": item.get("title", "Untitled"),
        "type": item.get("type", "generic"),
        "status": item.get("status", ""),
        "createdAt": item.get("createdAt", ""),
        "updatedAt": item.get("updatedAt", ""),
        "wordCount": item.get("wordCount", 0),
    }
