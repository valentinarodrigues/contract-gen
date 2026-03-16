from enum import Enum
from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field
import uuid


class ContractType(str, Enum):
    VENDOR = "vendor"
    SLA = "sla"
    NDA = "nda"
    GENERIC = "generic"


class ContractStatus(str, Enum):
    PROCESSING = "PROCESSING"   # Textract in progress
    READY = "READY"             # Sample uploaded and extracted
    GENERATING = "GENERATING"   # LLM in progress
    GENERATED = "GENERATED"     # Contract generated successfully
    FAILED = "FAILED"           # Error occurred


class PartyInfo(BaseModel):
    name: str
    address: str = ""
    jurisdiction: str = ""
    contact_email: str = ""


class UsagePattern(BaseModel):
    service_name: str
    volume: str = ""
    frequency: str = ""
    peak_usage: str = ""
    sla_requirements: dict[str, Any] = Field(default_factory=dict)
    notes: str = ""


class ContractMetadata(BaseModel):
    party_a: PartyInfo = Field(default_factory=lambda: PartyInfo(name="Party A"))
    party_b: PartyInfo = Field(default_factory=lambda: PartyInfo(name="Party B"))
    effective_date: str = ""
    term_months: int = 12
    governing_law: str = ""
    additional_clauses: list[str] = Field(default_factory=list)
    usage_patterns: list[UsagePattern] = Field(default_factory=list)
    custom_instructions: str = ""


class Contract(BaseModel):
    contractId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version: str = "v1"
    type: ContractType = ContractType.GENERIC
    status: ContractStatus = ContractStatus.PROCESSING
    title: str = ""
    s3Key: str = ""
    analysisId: str = ""
    extractedText: str = ""
    generatedContent: str = ""
    metadata: ContractMetadata = Field(default_factory=ContractMetadata)
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dynamo_item(self) -> dict[str, Any]:
        data = self.model_dump()
        data["metadata"] = self.metadata.model_dump_json()
        return data

    @classmethod
    def from_dynamo_item(cls, item: dict[str, Any]) -> "Contract":
        import json
        if isinstance(item.get("metadata"), str):
            item["metadata"] = json.loads(item["metadata"])
        return cls(**item)
