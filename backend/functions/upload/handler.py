"""
POST /contracts/upload
Accepts a multipart/form-data request with a file (PDF or DOCX) and optional metadata.
Uploads to S3, triggers Textract, creates DynamoDB record.
"""
import json
import os
import uuid
import base64
from datetime import datetime, timezone

# Layer imports
import sys
sys.path.insert(0, "/opt/python")

from models.contract import Contract, ContractStatus, ContractType, ContractMetadata
from storage import s3_client, dynamo_client
from utils.response import ok, error, options_response
from utils.text_extraction import extract_text_from_s3


UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_FILE_SIZE_MB = 10


def lambda_handler(event: dict, context) -> dict:
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return options_response()

    try:
        return handle_upload(event)
    except ValueError as e:
        return error(str(e), 400)
    except Exception as e:
        print(f"Upload error: {e}")
        return error("Upload failed", 500, str(e))


def handle_upload(event: dict) -> dict:
    # Parse multipart body
    body = event.get("body", "")
    is_base64 = event.get("isBase64Encoded", False)

    if is_base64:
        body = base64.b64decode(body)
    elif isinstance(body, str):
        body = body.encode()

    content_type = _get_header(event, "content-type") or ""

    if "multipart/form-data" not in content_type:
        return error("Content-Type must be multipart/form-data", 400)

    boundary = _extract_boundary(content_type)
    if not boundary:
        return error("Missing multipart boundary", 400)

    parts = _parse_multipart(body, boundary)

    file_data = parts.get("file")
    if not file_data:
        return error("No file provided in request", 400)

    file_bytes = file_data["data"]
    file_content_type = file_data.get("content_type", "application/octet-stream")
    original_filename = file_data.get("filename", "document")

    # Validate file size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return error(f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB", 400)

    # Parse optional metadata from form fields
    contract_type_str = parts.get("type", {}).get("text", "generic")
    title = parts.get("title", {}).get("text", original_filename)
    metadata_json = parts.get("metadata", {}).get("text", "{}")

    try:
        contract_type = ContractType(contract_type_str)
    except ValueError:
        contract_type = ContractType.GENERIC

    try:
        extra_metadata = json.loads(metadata_json)
    except json.JSONDecodeError:
        extra_metadata = {}

    # Upload to S3
    contract_id = str(uuid.uuid4())
    ext = ".pdf" if "pdf" in file_content_type else ".docx"
    s3_key = f"uploads/{contract_id}/original{ext}"

    s3_client.upload_file(UPLOADS_BUCKET, s3_key, file_bytes, file_content_type)

    # Trigger text extraction (async-style: store job, extract in handler)
    try:
        extracted_text = extract_text_from_s3(UPLOADS_BUCKET, s3_key)
        status = ContractStatus.READY
    except Exception as e:
        print(f"Textract error: {e}")
        extracted_text = ""
        status = ContractStatus.PROCESSING

    # Store extracted text in S3
    text_key = f"uploads/{contract_id}/extracted.txt"
    if extracted_text:
        s3_client.upload_text(UPLOADS_BUCKET, text_key, extracted_text)

    # Create DynamoDB record
    contract = Contract(
        contractId=contract_id,
        version="v1",
        type=contract_type,
        status=status,
        title=title,
        s3Key=s3_key,
        extractedText=extracted_text[:500] if extracted_text else "",  # preview only
        metadata=ContractMetadata(**extra_metadata) if extra_metadata else ContractMetadata(),
    )

    item = contract.to_dynamo_item()
    item["originalFilename"] = original_filename
    item["textS3Key"] = text_key if extracted_text else ""

    dynamo_client.put_item(item)

    return ok({
        "contractId": contract_id,
        "status": status.value,
        "title": title,
        "type": contract_type.value,
        "s3Key": s3_key,
        "extractedLength": len(extracted_text),
        "message": "Contract uploaded successfully" if extracted_text else "Contract uploaded, text extraction in progress",
    }, 201)


def _get_header(event: dict, name: str) -> str:
    headers = event.get("headers", {}) or {}
    return headers.get(name) or headers.get(name.title()) or headers.get(name.upper()) or ""


def _extract_boundary(content_type: str) -> str:
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            return part[len("boundary="):].strip('"')
    return ""


def _parse_multipart(body: bytes, boundary: str) -> dict:
    """Minimal multipart/form-data parser."""
    parts = {}
    delimiter = f"--{boundary}".encode()

    sections = body.split(delimiter)
    for section in sections[1:]:
        if section.strip() in (b"", b"--", b"--\r\n"):
            continue

        # Split headers from body
        if b"\r\n\r\n" in section:
            header_part, data = section.split(b"\r\n\r\n", 1)
        else:
            continue

        # Strip trailing boundary
        if data.endswith(b"\r\n"):
            data = data[:-2]

        headers = _parse_part_headers(header_part.decode("utf-8", errors="ignore"))
        disposition = headers.get("content-disposition", "")
        name = _extract_param(disposition, "name")
        filename = _extract_param(disposition, "filename")
        part_content_type = headers.get("content-type", "text/plain")

        if name:
            if filename:
                parts[name] = {
                    "data": data,
                    "filename": filename,
                    "content_type": part_content_type,
                }
            else:
                parts[name] = {
                    "text": data.decode("utf-8", errors="ignore"),
                    "content_type": part_content_type,
                }

    return parts


def _parse_part_headers(raw: str) -> dict:
    headers = {}
    for line in raw.strip().splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return headers


def _extract_param(header_value: str, param: str) -> str:
    for part in header_value.split(";"):
        part = part.strip()
        if part.lower().startswith(f"{param}="):
            return part[len(param) + 1:].strip('"')
    return ""
