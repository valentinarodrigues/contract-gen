#!/bin/bash
set -e

STACK_NAME="${STACK_NAME:-contract-gen}"
REGION="${REGION:-us-east-1}"
ENV="${ENV:-production}"
LLM_PROVIDER="${LLM_PROVIDER:-anthropic}"
LLM_MODEL_ID="${LLM_MODEL_ID:-claude-sonnet-4-6}"

echo "🚀 Deploying $STACK_NAME to $REGION ($ENV)"
echo "   LLM: $LLM_PROVIDER / $LLM_MODEL_ID"
echo ""

# Require at least one API key
if [[ "$LLM_PROVIDER" == "anthropic" && -z "$ANTHROPIC_API_KEY" ]]; then
  echo "❌ ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic"
  exit 1
fi
if [[ "$LLM_PROVIDER" == "openai" && -z "$OPENAI_API_KEY" ]]; then
  echo "❌ OPENAI_API_KEY is required when LLM_PROVIDER=openai"
  exit 1
fi

echo "📦 Building SAM application..."
sam build

echo "☁️  Deploying to AWS..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    "Environment=$ENV" \
    "LLMProvider=$LLM_PROVIDER" \
    "LLMModelId=$LLM_MODEL_ID" \
    "AnthropicApiKey=${ANTHROPIC_API_KEY:-}" \
    "OpenAIApiKey=${OPENAI_API_KEY:-}" \
  --resolve-s3 \
  --no-confirm-changeset

# Get outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text)

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

echo ""
echo "✅ Backend deployed!"
echo "   API URL: $API_URL"
echo ""

# Deploy frontend
echo "🎨 Building and deploying frontend..."
cd "$(dirname "$0")/../frontend"

# Write frontend env
cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF

npm run build

aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" \
  --delete \
  --region "$REGION"

# CloudFront invalidation
CF_ID=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --logical-resource-id CloudFrontDistribution \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text \
  --region "$REGION")

aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  --region "$REGION" > /dev/null

echo ""
echo "🎉 Full deployment complete!"
echo "   Frontend: $CF_URL"
echo "   API:      $API_URL"
