"""
POST /contracts/analyze
Accepts usage patterns, service data, and party information.
Stores analysis record in DynamoDB for use in contract generation.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import sys
sys.path.insert(0, "/opt/python")

from storage import dynamo_client
from utils.response import ok, error, options_response


def lambda_handler(event: dict, context) -> dict:
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return options_response()

    try:
        return handle_analyze(event)
    except ValueError as e:
        return error(str(e), 400)
    except Exception as e:
        print(f"Analyze error: {e}")
        return error("Analysis failed", 500, str(e))


def handle_analyze(event: dict) -> dict:
    body = event.get("body", "{}")
    if isinstance(body, str):
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return error("Invalid JSON body", 400)
    else:
        data = body or {}

    # Validate required fields
    if not data:
        return error("Request body is required", 400)

    analysis_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Build structured analysis record
    analysis = {
        "contractId": analysis_id,      # reuse table, analyses stored as contractId = analysis_id
        "version": "analysis",           # distinguisher in SK
        "status": "ANALYSIS",
        "title": data.get("title", f"Analysis {analysis_id[:8]}"),
        "createdAt": now,
        "updatedAt": now,

        # Core analysis data
        "usageLogs": json.dumps(data.get("usage_logs", [])),
        "servicePatterns": json.dumps(data.get("service_patterns", [])),
        "partyInfo": json.dumps(data.get("party_info", {})),
        "contractType": data.get("contract_type", "generic"),
        "summary": _build_summary(data),
        "rawInput": json.dumps(data),
    }

    dynamo_client.put_item(analysis)

    return ok({
        "analysisId": analysis_id,
        "title": analysis["title"],
        "contractType": analysis["contractType"],
        "summary": analysis["summary"],
        "createdAt": now,
        "message": "Usage pattern analysis stored successfully",
    }, 201)


def _build_summary(data: dict) -> str:
    """Build a human-readable summary of the analysis input."""
    parts = []

    usage_logs = data.get("usage_logs", [])
    if usage_logs:
        parts.append(f"{len(usage_logs)} usage log entries")

    service_patterns = data.get("service_patterns", [])
    if service_patterns:
        services = [p.get("service_name", "Unknown") for p in service_patterns if isinstance(p, dict)]
        parts.append(f"Services: {', '.join(services[:5])}")

    party_info = data.get("party_info", {})
    if party_info:
        party_a = party_info.get("party_a", {})
        party_b = party_info.get("party_b", {})
        if party_a.get("name"):
            parts.append(f"Party A: {party_a['name']}")
        if party_b.get("name"):
            parts.append(f"Party B: {party_b['name']}")

    return " | ".join(parts) if parts else "Usage pattern analysis"
