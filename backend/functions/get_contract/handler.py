"""
GET /contracts/{contractId}
Returns full contract details including generated content and download URL.
"""
import json
import os
import sys
sys.path.insert(0, "/opt/python")

from storage import s3_client, dynamo_client
from utils.response import ok, error, options_response

GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]


def lambda_handler(event: dict, context) -> dict:
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return options_response()

    try:
        return handle_get(event)
    except Exception as e:
        print(f"Get error: {e}")
        return error("Failed to get contract", 500, str(e))


def handle_get(event: dict) -> dict:
    path_params = event.get("pathParameters") or {}
    contract_id = path_params.get("contractId", "")

    if not contract_id:
        return error("contractId is required", 400)

    item = dynamo_client.get_item(contract_id, "v1")
    if not item:
        return error(f"Contract {contract_id} not found", 404)

    # Load full generated content from S3
    content = ""
    s3_key = item.get("s3Key", "")
    if s3_key:
        bucket = GENERATED_BUCKET if "generated/" in s3_key else UPLOADS_BUCKET
        try:
            content = s3_client.download_text(bucket, s3_key)
        except Exception as e:
            print(f"Could not load content from {s3_key}: {e}")

    # Generate presigned download URL
    download_url = ""
    if s3_key and "generated/" in s3_key:
        try:
            download_url = s3_client.generate_presigned_url(GENERATED_BUCKET, s3_key)
        except Exception:
            pass

    # Parse metadata
    metadata = item.get("metadata", "{}")
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            metadata = {}

    return ok({
        "contractId": item.get("contractId"),
        "title": item.get("title", "Untitled"),
        "type": item.get("type", "generic"),
        "status": item.get("status", ""),
        "content": content,
        "downloadUrl": download_url,
        "metadata": metadata,
        "wordCount": item.get("wordCount", 0),
        "analysisId": item.get("analysisId", ""),
        "createdAt": item.get("createdAt", ""),
        "updatedAt": item.get("updatedAt", ""),
    })
