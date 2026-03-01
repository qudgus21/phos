import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { imageGenerationSchema } from "@/lib/validations/image-generation";
import { getModelDef } from "@/lib/services/ai/models";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildPrompt } from "@/lib/services/ai/system-prompt";
import {
  getUserCreditInfo,
  deductCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { ApiError, CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

interface GenerateResponse {
  outputUrls: string[];
  creditsUsed: number;
  balanceAfter: number;
}

export const POST = withAuth(async (request, { user }) => {
  // 1. Body 파싱 & 검증
  const raw = await request.json();
  const parsed = imageGenerationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    throw new ValidationError("입력값이 올바르지 않습니다", fieldErrors);
  }

  const { modelId, prompt, images, width, height, imageCount } = parsed.data;

  // 2. 모델 설정 조회
  const modelDef = getModelDef(modelId);
  if (!modelDef) {
    throw new ApiError(`지원하지 않는 모델입니다: ${modelId}`, 400);
  }

  // 참조 이미지 수 검증
  if (images && images.length > modelDef.maxImages) {
    throw new ValidationError(
      `${modelDef.label}은 최대 ${modelDef.maxImages}개의 참조 이미지를 지원합니다`
    );
  }

  // 이미지 생성 수 검증
  const actualCount = Math.min(imageCount, modelDef.maxOutputs);

  // 3. 크레딧 + 플랜 정보 조회
  const creditInfo = await getUserCreditInfo(user.id);
  const creditCost =
    (Math.max(width, height) > 2048 ? 150 : 75) * actualCount;

  // 배치 크기 검증
  if (actualCount > creditInfo.plan.maxBatchSize) {
    throw new ValidationError(
      `${creditInfo.plan.name} 플랜은 한 번에 최대 ${creditInfo.plan.maxBatchSize}장까지 생성할 수 있습니다`
    );
  }

  // 쿨다운 검증
  const cooldownRemaining = checkCooldown(
    creditInfo.lastGenerationAt,
    creditInfo.plan.cooldownSeconds
  );
  if (cooldownRemaining > 0) {
    throw new ApiError(
      `생성 쿨다운 중입니다. ${cooldownRemaining}초 후 다시 시도해주세요`,
      429
    );
  }

  // 잔액 사전확인 (fast-fail)
  if (creditInfo.balance.total < creditCost) {
    throw new CreditError(
      "크레딧이 부족합니다",
      creditCost,
      creditInfo.balance.total
    );
  }

  // 4. AI 생성 호출
  const provider = resolveProvider({
    provider: modelDef.provider,
    modelId: modelDef.modelId,
    version: modelDef.version,
  });

  const result = await provider.generate(
    {
      provider: modelDef.provider,
      modelId: modelDef.modelId,
      version: modelDef.version,
      defaults: modelDef.defaults,
    },
    {
      images: images && images.length > 0 ? images : undefined,
      prompt: buildPrompt(prompt),
      params: { width, height, n: actualCount },
    }
  );

  // 5. 원자적 크레딧 차감 (성공 후)
  const deductResult = await deductCredits(
    user.id,
    creditCost,
    `이미지 생성 (${modelDef.label}, ${actualCount}장)`,
    { modelId, imageCount: actualCount, width, height }
  );

  if (!deductResult.success) {
    throw new CreditError(
      "크레딧이 부족합니다",
      deductResult.required ?? creditCost,
      deductResult.available ?? 0
    );
  }

  // 6. 응답
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      outputUrls: result.outputUrls,
      creditsUsed: creditCost,
      balanceAfter: deductResult.totalBalance ?? 0,
    },
  };

  return NextResponse.json(body);
});
