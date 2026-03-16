import time
import boto3
import os
from typing import Optional


def extract_text_from_s3(bucket: str, key: str, endpoint_url: Optional[str] = None) -> str:
    """
    Synchronously extract text from a PDF/image stored in S3 using Textract.
    Polls until complete (max ~5 minutes).
    For local dev with LocalStack, returns a placeholder since Textract isn't fully supported.
    """
    endpoint = endpoint_url or os.environ.get("AWS_ENDPOINT_URL")

    # LocalStack: return placeholder text for development
    if endpoint and "localstack" in endpoint:
        return f"[LocalStack mock] Extracted text from s3://{bucket}/{key}"

    textract = boto3.client("textract", region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))

    response = textract.start_document_text_detection(
        DocumentLocation={"S3Object": {"Bucket": bucket, "Name": key}}
    )
    job_id = response["JobId"]

    # Poll for completion
    max_retries = 60
    for attempt in range(max_retries):
        result = textract.get_document_text_detection(JobId=job_id)
        status = result["JobStatus"]

        if status == "SUCCEEDED":
            return _assemble_text(result, textract, job_id)
        elif status == "FAILED":
            raise RuntimeError(f"Textract job failed: {result.get('StatusMessage', 'Unknown error')}")

        time.sleep(5)

    raise TimeoutError(f"Textract job {job_id} timed out after {max_retries * 5} seconds")


def _assemble_text(first_page: dict, textract_client, job_id: str) -> str:
    """Assemble all pages of text from a Textract job."""
    blocks = list(first_page.get("Blocks", []))
    next_token = first_page.get("NextToken")

    while next_token:
        page = textract_client.get_document_text_detection(
            JobId=job_id, NextToken=next_token
        )
        blocks.extend(page.get("Blocks", []))
        next_token = page.get("NextToken")

    lines = [
        block["Text"]
        for block in blocks
        if block["BlockType"] == "LINE" and "Text" in block
    ]
    return "\n".join(lines)
