#!/bin/bash
set -euo pipefail

# ===== 설정 =====
FUNCTION_NAME="ai-image-optimizer"
REGION="us-east-2"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
MEMORY=1024
TIMEOUT=120
ROLE_NAME="lambda-ai-image-optimizer"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Step 1: Lambda용 node_modules 빌드 (linux-x64)..."

# 기존 node_modules 삭제 후 Lambda 타겟 플랫폼으로 설치
rm -rf node_modules
npm install --production --no-package-lock \
  --cpu=x64 --os=linux \
  --libc=glibc

echo "📁 Step 2: ZIP 패키지 생성..."
rm -f function.zip
zip -r function.zip index.mjs node_modules/ package.json -x "node_modules/.package-lock.json"

ZIP_SIZE=$(du -h function.zip | cut -f1)
echo "   → function.zip: ${ZIP_SIZE}"

echo "🔐 Step 3: IAM Role 확인/생성..."

# Role이 없으면 생성
if ! aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "   → Role 생성: $ROLE_NAME"
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' \
    --region "$REGION"

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    --region "$REGION"

  echo "   → Role 생성 완료. 10초 대기 (IAM 전파)..."
  sleep 10
else
  echo "   → Role 이미 존재: $ROLE_NAME"
fi

echo "🚀 Step 4: Lambda 함수 배포..."

# 함수가 있으면 업데이트, 없으면 생성
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "   → 기존 함수 업데이트..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$REGION"

  # 코드 업데이트 완료 대기
  aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --handler "$HANDLER" \
    --memory-size "$MEMORY" \
    --timeout "$TIMEOUT" \
    --region "$REGION"
else
  echo "   → 새 함수 생성..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --handler "$HANDLER" \
    --role "$ROLE_ARN" \
    --zip-file fileb://function.zip \
    --memory-size "$MEMORY" \
    --timeout "$TIMEOUT" \
    --region "$REGION"
fi

echo "   → Lambda 함수 준비 대기..."
aws lambda wait function-active-v2 \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION"

echo "🌐 Step 5: Function URL 확인/생성..."

# Function URL (API Gateway 대신 더 간단한 방식)
FUNC_URL=$(aws lambda get-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query 'FunctionUrl' \
  --output text 2>/dev/null || echo "NONE")

if [ "$FUNC_URL" = "NONE" ]; then
  echo "   → Function URL 생성..."
  FUNC_URL=$(aws lambda create-function-url-config \
    --function-name "$FUNCTION_NAME" \
    --auth-type NONE \
    --region "$REGION" \
    --query 'FunctionUrl' \
    --output text)

  # Function URL에 대한 퍼블릭 액세스 허용
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "FunctionURLAllowPublicAccess" \
    --action "lambda:InvokeFunctionUrl" \
    --principal "*" \
    --function-url-auth-type NONE \
    --region "$REGION"
fi

echo ""
echo "✅ 배포 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  함수:     $FUNCTION_NAME"
echo "  리전:     $REGION"
echo "  메모리:   ${MEMORY}MB"
echo "  타임아웃: ${TIMEOUT}초"
echo "  URL:      $FUNC_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  환경변수 설정이 필요합니다:"
echo "  aws lambda update-function-configuration \\"
echo "    --function-name $FUNCTION_NAME \\"
echo "    --environment 'Variables={SUPABASE_URL=...,SUPABASE_SERVICE_KEY=...,R2_ACCESS_KEY_ID=...,R2_SECRET_ACCESS_KEY=...,R2_S3_ENDPOINT=...,R2_BUCKET_NAME=...,R2_PUBLIC_URL=...}' \\"
echo "    --region $REGION"
