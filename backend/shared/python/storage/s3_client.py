import os
import boto3
from typing import Optional


def _s3_client():
    endpoint = os.environ.get("AWS_ENDPOINT_URL")
    kwargs = {"region_name": os.environ.get("AWS_DEFAULT_REGION", "us-east-1")}
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    return boto3.client("s3", **kwargs)


def upload_file(bucket: str, key: str, body: bytes, content_type: str = "application/octet-stream") -> str:
    _s3_client().put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)
    return key


def download_file(bucket: str, key: str) -> bytes:
    response = _s3_client().get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def download_text(bucket: str, key: str) -> str:
    return download_file(bucket, key).decode("utf-8")


def upload_text(bucket: str, key: str, text: str, content_type: str = "text/plain") -> str:
    return upload_file(bucket, key, text.encode("utf-8"), content_type)


def generate_presigned_url(bucket: str, key: str, expiry: int = 3600) -> str:
    endpoint = os.environ.get("AWS_ENDPOINT_URL")
    kwargs = {"region_name": os.environ.get("AWS_DEFAULT_REGION", "us-east-1")}
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    s3 = boto3.client("s3", **kwargs)
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expiry,
    )


def object_exists(bucket: str, key: str) -> bool:
    try:
        _s3_client().head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False
