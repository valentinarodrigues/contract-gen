import os
from langchain_core.language_models.chat_models import BaseChatModel
from .registry import LLMProviderEnum, ProviderConfig


class LLMFactory:
    """
    Build a LangChain ChatModel from environment variables.
    Set LLM_PROVIDER to: anthropic | openai | bedrock
    Set LLM_MODEL_ID to the model identifier for that provider.
    """

    @staticmethod
    def create(config: ProviderConfig | None = None) -> BaseChatModel:
        if config is None:
            config = LLMFactory._config_from_env()

        if config.is_anthropic:
            return LLMFactory._build_anthropic(config)
        elif config.is_openai:
            return LLMFactory._build_openai(config)
        elif config.is_bedrock:
            return LLMFactory._build_bedrock(config)
        else:
            raise ValueError(f"Unsupported LLM provider: {config.provider}")

    @staticmethod
    def _config_from_env() -> ProviderConfig:
        provider_str = os.environ.get("LLM_PROVIDER", "anthropic").lower()
        try:
            provider = LLMProviderEnum(provider_str)
        except ValueError:
            raise ValueError(
                f"Invalid LLM_PROVIDER='{provider_str}'. "
                f"Must be one of: {[e.value for e in LLMProviderEnum]}"
            )

        model_id = os.environ.get("LLM_MODEL_ID", "")
        if not model_id:
            defaults = {
                LLMProviderEnum.ANTHROPIC: "claude-sonnet-4-6",
                LLMProviderEnum.OPENAI: "gpt-4o",
                LLMProviderEnum.BEDROCK: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            }
            model_id = defaults[provider]

        api_key = ""
        if provider == LLMProviderEnum.ANTHROPIC:
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        elif provider == LLMProviderEnum.OPENAI:
            api_key = os.environ.get("OPENAI_API_KEY", "")

        return ProviderConfig(
            provider=provider,
            model_id=model_id,
            api_key=api_key,
            region=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        )

    @staticmethod
    def _build_anthropic(config: ProviderConfig) -> BaseChatModel:
        from langchain_anthropic import ChatAnthropic

        if not config.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic")

        return ChatAnthropic(
            model=config.model_id,
            api_key=config.api_key,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
        )

    @staticmethod
    def _build_openai(config: ProviderConfig) -> BaseChatModel:
        from langchain_openai import ChatOpenAI

        if not config.api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")

        return ChatOpenAI(
            model=config.model_id,
            api_key=config.api_key,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
        )

    @staticmethod
    def _build_bedrock(config: ProviderConfig) -> BaseChatModel:
        from langchain_aws import ChatBedrock

        return ChatBedrock(
            model_id=config.model_id,
            region_name=config.region,
            model_kwargs={
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
            },
        )
