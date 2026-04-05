import type { Dictionary } from "@/lib/i18n/config";

/**
 * Maps an API error code to the appropriate i18n error message.
 * Falls back to generationFailed for unknown codes.
 */
export function getApiErrorMessage(
  error: { code?: string; message?: string } | undefined,
  dict: Dictionary,
  fallback?: string
): string {
  const errors = dict.common.errors;
  switch (error?.code) {
    case "CREDIT_ERROR":
      return errors.insufficientCredits;
    case "AUTH_ERROR":
      return errors.authRequired;
    case "INTERNAL_ERROR":
      return errors.unexpectedError;
    case "RATE_LIMITED":
      return errors.tooManyRequests;
    default:
      return fallback ?? errors.generationFailed;
  }
}
