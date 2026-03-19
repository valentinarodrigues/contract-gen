<div align="center">

# ContractGen

**AI-Assisted Contract Generation from Usage Patterns**

Generate professional legal contracts by analyzing historical usage logs, existing contract samples, and service patterns using LLMs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![AWS SAM](https://img.shields.io/badge/AWS-SAM-orange.svg)](https://aws.amazon.com/serverless/sam/)

</div>

---

## Overview

ContractGen reduces manual effort in contract drafting by combining:

- **Historical usage data** — service logs, API call volumes, SLA metrics
- **Existing contract samples** — uploaded PDFs/DOCX used as style references
- **LLM generation** — produces complete, jurisdiction-aware legal documents

Built for internal technical teams, procurement, and vendor management. Supports Vendor/Supplier agreements, SLAs, NDAs, and generic business contracts.

---

## Architecture

```
CloudFront ──► S3 (React SPA)
                     │
             API Gateway HTTP API
                     │
       ┌─────────────┼─────────────┐
       │             │             │
  Lambda          Lambda        Lambda
  upload/        analyze/      generate/
  handler        handler        handler
       │             │             │
       └─────────────┼─────────────┘
                     │
              S3  DynamoDB  Textract
```

**Cost-optimized serverless:**
- Lambda on arm64/Graviton3 (~20% cheaper than x86)
- DynamoDB on-demand billing (zero cost at rest)
- API Gateway HTTP API (70% cheaper than REST API)
- S3 + CloudFront for frontend (static hosting)

---

## Features

| Feature | Details |
|---------|---------|
| **Contract Types** | Vendor/Supplier, Consumer/SLA, NDA, Generic |
| **Document Upload** | Drag-and-drop PDF/DOCX, text extracted via AWS Textract |
| **Usage Analysis** | Structured form + raw JSON log ingestion |
| **3-Step Wizard** | Contract details → Reference data → Generate |
| **LLM Agnostic** | Swap providers via a single env var — no code changes |
| **Download** | Copy to clipboard or download as `.txt` |

---

## Plug-and-Play LLM Support

Set `LLM_PROVIDER` and `LLM_MODEL_ID` to switch providers at any time:

| Provider | `LLM_PROVIDER` | `LLM_MODEL_ID` |
|----------|---------------|----------------|
| Anthropic Claude | `anthropic` | `claude-sonnet-4-6`, `claude-opus-4-6` |
| OpenAI | `openai` | `gpt-4o`, `gpt-4o-mini` |
| AWS Bedrock | `bedrock` | `anthropic.claude-3-5-sonnet-20241022-v2:0` |

---

## Quick Start (Local Dev)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js 20+](https://nodejs.org/)
- Python 3.12+
- An API key for your chosen LLM provider

### 1. Clone and configure

```bash
git clone https://github.com/valentinarodrigues/contract-gen.git
cd contract-gen
```

Edit `local/env.json` and add your API key:

```json
{
  "Parameters": {
    "LLM_PROVIDER": "anthropic",
    "LLM_MODEL_ID": "claude-sonnet-4-6",
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "OPENAI_API_KEY": ""
  }
}
```

### 2. Start LocalStack (S3 + DynamoDB)

```bash
docker compose -f local/docker-compose.yml up -d
```

### 3. Build and start the backend

```bash
make build
make local
```

API runs on `http://localhost:3000`.

### 4. Start the frontend

```bash
make install    # first time only
make frontend
```

Open `http://localhost:5173`.

---

## Usage

```
1. Upload Samples   Upload existing contract PDFs/DOCX as style references
2. Analyze Patterns Input service usage logs, volumes, and party details
3. Generate         3-step wizard produces the complete contract
4. View / Download  Review, copy, or download the generated contract
```

---

## Deploy to AWS

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export LLM_PROVIDER="anthropic"
export LLM_MODEL_ID="claude-sonnet-4-6"

./scripts/deploy.sh
```

On completion, the script prints:
- **Frontend URL** — CloudFront distribution
- **API URL** — HTTP API endpoint

> For guided first-time setup: `make deploy-guided`

---

## Project Structure

```
contract-gen/
├── template.yaml                   # AWS SAM — all infrastructure
├── Makefile                        # build, local, deploy, frontend targets
├── backend/
│   ├── shared/python/              # Lambda Layer (shared across all functions)
│   │   ├── llm/                    # LLMFactory — provider abstraction
│   │   ├── prompts/                # Prompt templates per contract type
│   │   ├── models/                 # Pydantic data models
│   │   ├── storage/                # S3 + DynamoDB helpers
│   │   └── utils/                  # Response helpers, Textract extraction
│   └── functions/
│       ├── upload/                 # POST /contracts/upload
│       ├── analyze/                # POST /contracts/analyze
│       ├── generate/               # POST /contracts/generate
│       ├── list_contracts/         # GET  /contracts
│       └── get_contract/           # GET  /contracts/{id}
├── frontend/
│   └── src/
│       ├── pages/                  # Dashboard, Upload, Analyze, Generate, ContractView
│       ├── components/             # Layout, DropZone, ContractTypeSelector, StatusBadge
│       └── api/client.ts           # Typed API client
├── local/
│   ├── docker-compose.yml          # LocalStack for local dev
│   └── env.json                    # Local environment variables
└── scripts/
    └── deploy.sh                   # Full build + deploy script
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/contracts/upload` | Upload PDF/DOCX, extract text via Textract |
| `POST` | `/contracts/analyze` | Store usage patterns and party info |
| `POST` | `/contracts/generate` | Generate contract using LLM |
| `GET` | `/contracts` | List all contracts |
| `GET` | `/contracts/{id}` | Get contract + presigned download URL |

### Example: Generate a contract

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/production/contracts/generate \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Infrastructure | AWS SAM, CloudFormation |
| Backend | Python 3.12, AWS Lambda, LangChain |
| AI / LLM | Anthropic Claude, OpenAI, AWS Bedrock |
| Storage | Amazon S3, DynamoDB |
| OCR | AWS Textract |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Local Dev | LocalStack, Docker |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push and open a pull request

---

## Teardown

```bash
make teardown
```

Permanently deletes all AWS resources. You will be prompted to confirm by typing the stack name.

---

## License

MIT © [valentinarodrigues](https://github.com/valentinarodrigues)
