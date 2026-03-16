from enum import Enum
from dataclasses import dataclass


class LLMProviderEnum(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    BEDROCK = "bedrock"


@dataclass
class ProviderConfig:
    provider: LLMProviderEnum
    model_id: str
    api_key: str = ""
    region: str = "us-east-1"
    max_tokens: int = 8192
    temperature: float = 0.3

    @property
    def is_bedrock(self) -> bool:
        return self.provider == LLMProviderEnum.BEDROCK

    @property
    def is_anthropic(self) -> bool:
        return self.provider == LLMProviderEnum.ANTHROPIC

    @property
    def is_openai(self) -> bool:
        return self.provider == LLMProviderEnum.OPENAI
