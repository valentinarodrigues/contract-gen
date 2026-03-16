from langchain_core.prompts import ChatPromptTemplate

SYSTEM_BASE = """You are an expert contract attorney and legal drafter. Your role is to generate
professional, legally sound contract documents based on the provided context.

Guidelines:
- Use clear, precise legal language appropriate for the contract type
- Include all standard clauses required for this contract type
- Incorporate specific terms from the usage patterns and party information provided
- Structure the document with proper sections, numbering, and formatting
- Use UPPERCASE for defined terms on first use (e.g., "SERVICES", "CONFIDENTIAL INFORMATION")
- Include signature blocks at the end
- Do not include any commentary outside the contract text itself
- Output the complete contract in plain text format with clear section headers

Reference existing contract samples to match tone, structure, and jurisdiction-specific language."""


def build_base_context_section() -> str:
    return """
## CONTEXT PROVIDED

### Party Information
Party A (First Party / Client):
{party_a}

Party B (Second Party / Provider):
{party_b}

### Contract Details
- Effective Date: {effective_date}
- Term: {term_months} months
- Governing Law / Jurisdiction: {governing_law}

### Usage Patterns & Service Details
{usage_patterns}

### Existing Contract Samples (for reference and style alignment)
{contract_samples}

### Special Instructions
{custom_instructions}
"""


def make_prompt(contract_type_instructions: str) -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE),
        ("human", contract_type_instructions + build_base_context_section() + "\n\nGenerate the complete contract now:"),
    ])
