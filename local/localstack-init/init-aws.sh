#!/bin/bash
set -e

echo "Initializing LocalStack resources..."

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
ACCOUNT="000000000000"

# Create S3 buckets
aws --endpoint-url=$ENDPOINT s3 mb s3://contract-gen-uploads-${ACCOUNT}-${REGION} --region $REGION
aws --endpoint-url=$ENDPOINT s3 mb s3://contract-gen-generated-${ACCOUNT}-${REGION} --region $REGION
echo "S3 buckets created"

# Create DynamoDB table
aws --endpoint-url=$ENDPOINT dynamodb create-table \
  --table-name contract-gen-contracts \
  --attribute-definitions \
    AttributeName=contractId,AttributeType=S \
    AttributeName=version,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=contractId,KeyType=HASH \
    AttributeName=version,KeyType=RANGE \
  --global-secondary-indexes '[
    {
      "IndexName": "status-index",
      "KeySchema": [
        {"AttributeName": "status", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION
echo "DynamoDB table created"

echo "LocalStack initialization complete!"
