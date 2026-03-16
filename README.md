# ContractGen — AI-Assisted Contract Generation

Generate professional legal contracts from historical usage patterns, sample documents, and party information using LLMs.

## Architecture

```
CloudFront → S3 (React SPA)
                │
        API Gateway HTTP API
                │
    ┌───────────┼───────────┐
 Lambda      Lambda      Lambda
 upload/    analyze/    generate/
                │
         S3 + DynamoDB + Textract
```

**Cost-optimized serverless:** Lambda (arm64/Graviton3), DynamoDB on-demand, API Gateway HTTP API.

---

## Quick Start (Local Dev)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js 20+](https://nodejs.org/)
- Python 3.12+

### 1. Start local AWS services

```bash
docker compose -f local/docker-compose.yml up -d
```

This starts LocalStack with S3 and DynamoDB on port 4566.

### 2. Configure your LLM API key

Edit `local/env.json` and set your API key:

```json
{
  "Parameters": {
    "LLM_PROVIDER": "anthropic",
    "LLM_MODEL_ID": "claude-sonnet-4-6",
    "ANTHROPIC_API_KEY": "sk-ant-..."
  }
}
```

**Supported providers:**

| Provider | `LLM_PROVIDER` | `LLM_MODEL_ID` examples |
|----------|---------------|------------------------|
| Anthropic | `anthropic` | `claude-sonnet-4-6`, `claude-opus-4-6` |
| OpenAI | `openai` | `gpt-4o`, `gpt-4o-mini` |
| AWS Bedrock | `bedrock` | `anthropic.claude-3-5-sonnet-20241022-v2:0` |

### 3. Start the backend

```bash
make build
make local
```

SAM local API runs on `http://localhost:3000`.

### 4. Start the frontend

In a separate terminal:

```bash
make install   # first time only
make frontend
```

Open `http://localhost:5173`.

---

## Workflow

```
1. Upload Samples  →  Upload existing contract PDFs/DOCX as reference
2. Analyze Patterns → Input service usage logs and party details
3. Generate        → 3-step wizard → AI generates the complete contract
4. View / Download → Review, copy, or download the generated contract
```

---

## Deploy to AWS

```bash
export ANTHROPIC_API_KEY="sk-ant-..."   # or OPENAI_API_KEY
export LLM_PROVIDER="anthropic"
export LLM_MODEL_ID="claude-sonnet-4-6"

./scripts/deploy.sh
```

Or with Make:

```bash
ANTHROPIC_API_KEY=sk-ant-... LLM_PROVIDER=anthropic make deploy
```

Outputs:
- `ApiEndpoint` — HTTP API URL
- `CloudFrontUrl` — Frontend URL

---

## Project Structure

```
contract-gen/
├── template.yaml               # AWS SAM — all resources
├── Makefile                    # Build, local dev, deploy commands
├── backend/
│   ├── shared/python/          # Lambda Layer (shared code)
│   │   ├── llm/                # Plug-and-play LLM factory (Anthropic/OpenAI/Bedrock)
│   │   ├── prompts/            # Contract-type-specific prompt templates
│   │   ├── models/             # Pydantic data models
│   │   ├── storage/            # S3 + DynamoDB helpers
│   │   └── utils/              # Response helpers, Textract extraction
│   └── functions/
│       ├── upload/             # POST /contracts/upload
│       ├── analyze/            # POST /contracts/analyze
│       ├── generate/           # POST /contracts/generate
│       ├── list_contracts/     # GET  /contracts
│       └── get_contract/       # GET  /contracts/{id}
├── frontend/                   # React + TypeScript + Tailwind SPA
│   └── src/
│       ├── pages/              # Dashboard, Upload, Analyze, Generate, ContractView
│       ├── components/         # Layout, DropZone, ContractTypeSelector, StatusBadge
│       └── api/client.ts       # Typed API client
├── local/
│   ├── docker-compose.yml      # LocalStack (S3 + DynamoDB)
│   └── env.json                # Local env vars (add your API keys here)
└── scripts/
    └── deploy.sh               # Full deploy script
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/contracts/upload` | Upload PDF/DOCX sample, extract text via Textract |
| `POST` | `/contracts/analyze` | Store usage patterns and party info |
| `POST` | `/contracts/generate` | Generate contract using LLM |
| `GET` | `/contracts` | List all contracts |
| `GET` | `/contracts/{id}` | Get contract details + download URL |

### Generate Request Body

```json
{
  "contract_type": "vendor",
  "title": "Master Services Agreement",
  "sample_contract_ids": ["abc-123"],
  "analysis_id": "def-456",
  "party_info": {
    "party_a": { "name": "Acme Corp", "address": "New York, NY" },
    "party_b": { "name": "Tech Vendor Inc", "address": "San Francisco, CA" }
  },
  "effective_date": "2026-04-01",
  "term_months": 24,
  "governing_law": "State of New York",
  "custom_instructions": "Include a 30-day cure period for material breaches."
}
```

---

## Supported Contract Types

| Type | Description |
|------|-------------|
| `vendor` | Vendor/Supplier agreements with pricing, delivery, warranties |
| `sla` | Service Level Agreements with KPIs, credits, support tiers |
| `nda` | Non-Disclosure Agreements with scope, obligations, remedies |
| `generic` | General business agreements (flexible) |

---

## Teardown

```bash
make teardown
```

> This permanently deletes all AWS resources. Type the stack name to confirm.
