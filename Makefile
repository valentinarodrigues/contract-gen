.PHONY: build local deploy deploy-frontend frontend install clean teardown

STACK_NAME ?= contract-gen
REGION     ?= us-east-1
ENV        ?= development

# ─── Backend ────────────────────────────────────────────────────────────────
build:
	sam build --use-container

local:
	@echo "Starting LocalStack and SAM local API..."
	docker compose -f local/docker-compose.yml up -d
	@sleep 3
	sam local start-api \
		--env-vars local/env.json \
		--docker-network localstack_default \
		--warm-containers EAGER \
		--port 3000

local-stop:
	docker compose -f local/docker-compose.yml down

# ─── Deploy ─────────────────────────────────────────────────────────────────
deploy:
	sam build
	sam deploy \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			Environment=$(ENV) \
			LLMProvider=$(LLM_PROVIDER) \
			LLMModelId=$(LLM_MODEL_ID) \
			AnthropicApiKey=$(ANTHROPIC_API_KEY) \
			OpenAIApiKey=$(OPENAI_API_KEY) \
		--resolve-s3 \
		--no-confirm-changeset

deploy-guided:
	sam build
	sam deploy --guided --stack-name $(STACK_NAME) --region $(REGION)

deploy-frontend:
	@echo "Building and deploying frontend..."
	cd frontend && npm run build
	$(eval BUCKET := $(shell aws cloudformation describe-stack-resource \
		--stack-name $(STACK_NAME) \
		--logical-resource-id FrontendBucket \
		--query 'StackResourceDetail.PhysicalResourceId' \
		--output text --region $(REGION)))
	$(eval CF_ID := $(shell aws cloudformation describe-stack-resource \
		--stack-name $(STACK_NAME) \
		--logical-resource-id CloudFrontDistribution \
		--query 'StackResourceDetail.PhysicalResourceId' \
		--output text --region $(REGION)))
	aws s3 sync frontend/dist/ s3://$(BUCKET)/ --delete --region $(REGION)
	aws cloudfront create-invalidation --distribution-id $(CF_ID) --paths "/*" --region $(REGION)
	@echo "Frontend deployed!"

# ─── Frontend Dev ───────────────────────────────────────────────────────────
frontend:
	cd frontend && npm run dev

install:
	cd frontend && npm install
	pip install -r backend/shared/requirements.txt

# ─── Utilities ──────────────────────────────────────────────────────────────
teardown:
	@echo "WARNING: This will delete the stack and all resources!"
	@read -p "Type the stack name to confirm ($(STACK_NAME)): " name; \
	if [ "$$name" = "$(STACK_NAME)" ]; then \
		sam delete --stack-name $(STACK_NAME) --region $(REGION) --no-prompts; \
	else \
		echo "Aborted."; \
	fi

clean:
	rm -rf .aws-sam frontend/dist frontend/node_modules

logs:
	sam logs --stack-name $(STACK_NAME) --tail --region $(REGION)
