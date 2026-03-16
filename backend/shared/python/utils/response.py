import json
import os
from typing import Any


def _cors_headers() -> dict[str, str]:
    origin = os.environ.get("ALLOWED_ORIGINS", "*")
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Content-Type": "application/json",
    }


def ok(body: Any, status_code: int = 200) -> dict:
    return {
        "statusCode": status_code,
        "headers": _cors_headers(),
        "body": json.dumps(body, default=str),
    }


def error(message: str, status_code: int = 500, details: Any = None) -> dict:
    body: dict[str, Any] = {"error": message}
    if details:
        body["details"] = details
    return {
        "statusCode": status_code,
        "headers": _cors_headers(),
        "body": json.dumps(body, default=str),
    }


def options_response() -> dict:
    return {
        "statusCode": 200,
        "headers": _cors_headers(),
        "body": "",
    }
