import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

const REPLICATE_BASE_URL = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status:
    | "starting"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled"
    | "aborted";
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get: string; cancel: string };
}

/** Replicate 에러 코드에서 재시도 가능 여부 판별 */
function parseReplicateError(error?: string | null): {
  code: string | null;
  retryable: boolean;
  userMessage: string;
} {
  // 에러 문자열에서 E#### 코드 추출
  const codeMatch = error?.match(/\bE(\d{4})\b/);
  const code = codeMatch ? `E${codeMatch[1]}` : null;

  switch (code) {
    case "E1001": // OOM — 같은 입력이면 또 터짐
      return {
        code,
        retryable: false,
        userMessage: "이미지 처리에 필요한 메모리가 부족합니다. 이미지 크기를 줄여주세요.",
      };
    case "E6716": // 시작 타임아웃
      return { code, retryable: true, userMessage: "일시적 오류입니다. 다시 시도해주세요." };
    case "E9825": // 파일 업로드 실패
      return { code, retryable: true, userMessage: "파일 업로드에 실패했습니다. 다시 시도해주세요." };
    case "E9243": // 시작 에러
      return { code, retryable: true, userMessage: "일시적 오류입니다. 다시 시도해주세요." };
    case "E8765": // 헬스체크 실패
      return { code, retryable: true, userMessage: "AI 모델이 일시적으로 사용할 수 없습니다. 다시 시도해주세요." };
    case "E4875": // 웹훅 URL 비어있음
      return { code, retryable: false, userMessage: "AI 이미지 생성에 실패했습니다." };
    case "E8367": // 비정상 종료
      return { code, retryable: true, userMessage: "일시적 오류입니다. 다시 시도해주세요." };
    case "E1000": // 알 수 없는 에러
    default:
      return { code, retryable: true, userMessage: "일시적 오류입니다. 다시 시도해주세요." };
  }
}

export class ReplicateProvider implements AIProvider {
  readonly name: AIProviderName = "replicate";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new ApiError(
        "REPLICATE_API_TOKEN 환경변수가 설정되지 않았습니다",
        500
      );
    }

    // buildInput에서 이미 모델별 파라미터가 완성된 상태
    const modelInput: Record<string, unknown> = {
      ...input.params,
    };

    // buildInput을 사용하지 않는 레거시 호출 대응
    if (!input.params || Object.keys(input.params).length === 0) {
      modelInput.prompt = input.prompt ?? "";
      if (input.images && input.images.length > 0) {
        modelInput.image = input.images[0];
      }
      if (input.negativePrompt) {
        modelInput.negative_prompt = input.negativePrompt;
      }
    }

    // 공식 모델: /v1/models/{owner}/{name}/predictions
    // 버전 지정: /v1/predictions + version
    let apiUrl: string;
    let body: Record<string, unknown>;

    if (model.version) {
      apiUrl = `${REPLICATE_BASE_URL}/predictions`;
      body = { version: model.version, input: modelInput };
    } else {
      apiUrl = `${REPLICATE_BASE_URL}/models/${model.modelId}/predictions`;
      body = { input: modelInput };
    }

    const start = Date.now();
    const maxGenerationRetries = 1;

    for (let attempt = 0; attempt <= maxGenerationRetries; attempt++) {
      // Prefer: wait 헤더로 최대 60초 동기 대기 (429 시 자동 재시도)
      // Cancel-After: 모델이 stuck 되는 것 방지 (5분 제한)
      const res = await this.fetchWithRetry(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
          Prefer: "wait=60",
          "Cancel-After": "5m",
        },
        body: JSON.stringify(body),
      });

      let prediction = (await res.json()) as ReplicatePrediction;

      // 아직 완료되지 않은 경우 polling
      if (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled" &&
        prediction.status !== "aborted"
      ) {
        prediction = await this.poll(prediction, apiToken);
      }

      // 성공
      if (prediction.status === "succeeded") {
        const outputUrls = this.extractUrls(prediction.output);
        if (outputUrls.length === 0) {
          throw new ApiError("Replicate에서 결과 URL을 받지 못했습니다", 502);
        }
        return {
          outputUrls,
          provider: this.name,
          modelId: model.modelId,
          durationMs: Date.now() - start,
        };
      }

      // canceled/aborted 처리
      if (
        prediction.status === "canceled" ||
        prediction.status === "aborted"
      ) {
        console.warn(
          `[replicate] prediction ${prediction.status}:`,
          prediction.id
        );
        if (attempt < maxGenerationRetries) continue;
        throw new ApiError("AI 이미지 생성이 취소되었습니다. 다시 시도해주세요.", 502);
      }

      // failed — 에러 코드별 분기
      const { code, retryable, userMessage } = parseReplicateError(
        prediction.error
      );
      console.error(
        `[replicate] prediction failed (${code ?? "unknown"}):`,
        prediction.error
      );

      if (retryable && attempt < maxGenerationRetries) {
        console.info(`[replicate] retrying prediction (attempt ${attempt + 1})`);
        continue;
      }

      throw new ApiError(userMessage, 502);
    }

    throw new ApiError("AI 이미지 생성에 실패했습니다", 502);
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    maxRetries = 5
  ): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, init);

      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get("retry-after")) || 10;
        const waitMs = Math.min(retryAfter, 30) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        console.error(`[replicate] API error (${res.status}):`, text);
        throw new ApiError("AI 이미지 생성 중 오류가 발생했습니다", 502);
      }

      return res;
    }

    throw new ApiError("Replicate API 재시도 횟수 초과 (429)", 502);
  }

  private async poll(
    prediction: ReplicatePrediction,
    apiToken: string,
    maxAttempts = 60
  ): Promise<ReplicatePrediction> {
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) {
      throw new ApiError("Replicate polling URL이 없습니다", 502);
    }

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      if (!res.ok) {
        throw new ApiError(`Replicate polling 오류 (${res.status})`, 502);
      }

      const updated = (await res.json()) as ReplicatePrediction;
      if (
        updated.status === "succeeded" ||
        updated.status === "failed" ||
        updated.status === "canceled" ||
        updated.status === "aborted"
      ) {
        return updated;
      }
    }

    throw new ApiError("Replicate 생성 시간 초과", 504);
  }

  private extractUrls(
    output: string | string[] | null | undefined
  ): string[] {
    if (!output) return [];
    if (typeof output === "string") return [output];
    if (Array.isArray(output)) {
      return output.filter((item): item is string => typeof item === "string");
    }
    return [];
  }
}
