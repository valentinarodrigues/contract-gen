"""
POST /contracts/generate
Generates a new contract using the LLM pipeline.
Loads existing contract samples + analysis from DynamoDB/S3, runs LangChain LCEL chain.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import sys
sys.path.insert(0, "/opt/python")

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from llm.factory import LLMFactory
from prompts.vendor import vendor_prompt
from prompts.sla import sla_prompt
from prompts.nda import nda_prompt
from prompts.generic import generic_prompt
from models.contract import Contract, ContractStatus, ContractType, ContractMetadata, PartyInfo, UsagePattern
from storage import s3_client, dynamo_client
from utils.response import ok, error, options_response

UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]

PROMPT_MAP = {
    ContractType.VENDOR: vendor_prompt,
    ContractType.SLA: sla_prompt,
    ContractType.NDA: nda_prompt,
    ContractType.GENERIC: generic_prompt,
}


def lambda_handler(event: dict, context) -> dict:
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return options_response()

    try:
        return handle_generate(event)
    except ValueError as e:
        return error(str(e), 400)
    except Exception as e:
        print(f"Generate error: {e}")
        return error("Contract generation failed", 500, str(e))


def handle_generate(event: dict) -> dict:
    body = event.get("body", "{}")
    if isinstance(body, str):
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return error("Invalid JSON body", 400)
    else:
        data = body or {}

    contract_type_str = data.get("contract_type", "generic")
    try:
        contract_type = ContractType(contract_type_str)
    except ValueError:
        contract_type = ContractType.GENERIC

    # Load existing contract samples for reference
    sample_ids = data.get("sample_contract_ids", [])
    contract_samples = _load_contract_samples(sample_ids)

    # Load usage analysis
    analysis_id = data.get("analysis_id", "")
    usage_analysis = _load_analysis(analysis_id)

    # Build party info
    party_info = data.get("party_info", {})
    metadata_data = {
        "party_a": party_info.get("party_a", {"name": "Party A"}),
        "party_b": party_info.get("party_b", {"name": "Party B"}),
        "effective_date": data.get("effective_date", ""),
        "term_months": data.get("term_months", 12),
        "governing_law": data.get("governing_law", ""),
        "additional_clauses": data.get("additional_clauses", []),
        "custom_instructions": data.get("custom_instructions", ""),
    }

    # Build usage patterns from analysis
    usage_patterns = _format_usage_patterns(usage_analysis)
    metadata_data["usage_patterns"] = [u.model_dump() for u in usage_patterns]

    metadata = ContractMetadata(**metadata_data)

    # Build chain input
    chain_input = {
        "party_a": _format_party(metadata.party_a),
        "party_b": _format_party(metadata.party_b),
        "effective_date": metadata.effective_date or "To be determined",
        "term_months": str(metadata.term_months),
        "governing_law": metadata.governing_law or "To be determined",
        "usage_patterns": _format_usage_patterns_text(usage_analysis, usage_patterns),
        "contract_samples": _format_samples_text(contract_samples),
        "custom_instructions": metadata.custom_instructions or "None",
    }

    # Select prompt template
    prompt_template = PROMPT_MAP.get(contract_type, generic_prompt)

    # Build and run LCEL chain
    llm = LLMFactory.create()
    chain = prompt_template | llm | StrOutputParser()

    generated_content = chain.invoke(chain_input)

    # Store generated contract
    contract_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    title = data.get("title", f"{contract_type.value.title()} Contract - {now[:10]}")

    s3_key = f"generated/{contract_id}/contract.txt"
    s3_client.upload_text(GENERATED_BUCKET, s3_key, generated_content, "text/plain")

    contract = Contract(
        contractId=contract_id,
        version="v1",
        type=contract_type,
        status=ContractStatus.GENERATED,
        title=title,
        s3Key=s3_key,
        analysisId=analysis_id,
        generatedContent=generated_content[:1000],  # preview
        metadata=metadata,
        createdAt=now,
        updatedAt=now,
    )

    item = contract.to_dynamo_item()
    item["sampleContractIds"] = json.dumps(sample_ids)
    item["wordCount"] = len(generated_content.split())
    dynamo_client.put_item(item)

    # Generate presigned URL for download
    try:
        download_url = s3_client.generate_presigned_url(GENERATED_BUCKET, s3_key, expiry=3600)
    except Exception:
        download_url = ""

    return ok({
        "contractId": contract_id,
        "title": title,
        "type": contract_type.value,
        "status": ContractStatus.GENERATED.value,
        "content": generated_content,
        "downloadUrl": download_url,
        "wordCount": len(generated_content.split()),
        "createdAt": now,
    }, 201)


def _load_contract_samples(sample_ids: list[str]) -> list[str]:
    """Load extracted text from uploaded contract samples."""
    samples = []
    for sid in sample_ids[:3]:  # Limit to 3 samples to control token usage
        item = dynamo_client.get_item(sid, "v1")
        if not item:
            continue
        text_key = item.get("textS3Key", "")
        if text_key:
            try:
                text = s3_client.download_text(UPLOADS_BUCKET, text_key)
                samples.append(text[:3000])  # Limit per sample
            except Exception as e:
                print(f"Could not load sample {sid}: {e}")
    return samples


def _load_analysis(analysis_id: str) -> dict:
    """Load analysis record from DynamoDB."""
    if not analysis_id:
        return {}
    item = dynamo_client.get_item(analysis_id, "analysis")
    if not item:
        return {}
    result = {}
    for field in ("usageLogs", "servicePatterns", "partyInfo"):
        val = item.get(field, "[]")
        try:
            result[field] = json.loads(val) if isinstance(val, str) else val
        except json.JSONDecodeError:
            result[field] = []
    result["summary"] = item.get("summary", "")
    return result


def _format_party(party: PartyInfo) -> str:
    parts = [party.name]
    if party.address:
        parts.append(f"Address: {party.address}")
    if party.jurisdiction:
        parts.append(f"Jurisdiction: {party.jurisdiction}")
    if party.contact_email:
        parts.append(f"Contact: {party.contact_email}")
    return "\n".join(parts)


def _format_usage_patterns(analysis: dict) -> list[UsagePattern]:
    patterns = []
    for p in analysis.get("servicePatterns", []):
        if isinstance(p, dict):
            try:
                patterns.append(UsagePattern(**p))
            except Exception:
                pass
    return patterns


def _format_usage_patterns_text(analysis: dict, patterns: list[UsagePattern]) -> str:
    lines = []
    if analysis.get("summary"):
        lines.append(f"Summary: {analysis['summary']}")

    for p in patterns:
        lines.append(f"\nService: {p.service_name}")
        if p.volume:
            lines.append(f"  Volume: {p.volume}")
        if p.frequency:
            lines.append(f"  Frequency: {p.frequency}")
        if p.peak_usage:
            lines.append(f"  Peak Usage: {p.peak_usage}")
        if p.sla_requirements:
            lines.append(f"  SLA Requirements: {json.dumps(p.sla_requirements)}")
        if p.notes:
            lines.append(f"  Notes: {p.notes}")

    usage_logs = analysis.get("usageLogs", [])
    if usage_logs:
        lines.append(f"\nUsage Log Summary ({len(usage_logs)} entries):")
        for log in usage_logs[:5]:
            lines.append(f"  - {json.dumps(log)}")
        if len(usage_logs) > 5:
            lines.append(f"  ... and {len(usage_logs) - 5} more entries")

    return "\n".join(lines) if lines else "No specific usage patterns provided"


def _format_samples_text(samples: list[str]) -> str:
    if not samples:
        return "No existing contract samples provided"

    result = []
    for i, sample in enumerate(samples, 1):
        result.append(f"--- Sample Contract {i} ---\n{sample}\n")
    return "\n".join(result)
