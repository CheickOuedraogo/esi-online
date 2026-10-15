// Format d'erreur unique de l'API : schema Zod et type d'erreur partagés front/back.

import { z } from "zod";

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  ACCOUNT_PENDING: "ACCOUNT_PENDING",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  MUST_CHANGE_PASSWORD: "MUST_CHANGE_PASSWORD",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorCodeToStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ACCOUNT_PENDING: 403,
  ACCOUNT_REJECTED: 403,
  ACCOUNT_SUSPENDED: 403,
  MUST_CHANGE_PASSWORD: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export const apiErrorCodeSchema = z.enum([
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.UNAUTHENTICATED,
  ErrorCode.FORBIDDEN,
  ErrorCode.ACCOUNT_PENDING,
  ErrorCode.ACCOUNT_REJECTED,
  ErrorCode.ACCOUNT_SUSPENDED,
  ErrorCode.MUST_CHANGE_PASSWORD,
  ErrorCode.NOT_FOUND,
  ErrorCode.CONFLICT,
  ErrorCode.PAYLOAD_TOO_LARGE,
  ErrorCode.UNSUPPORTED_MEDIA_TYPE,
  ErrorCode.RATE_LIMITED,
  ErrorCode.INTERNAL_ERROR,
]);

// Objet d'erreur interne (champ `error` de la réponse).
export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// Enveloppe complète renvoyée par l'API : { error: { code, message, details? } }.
export const apiErrorResponseSchema = z.object({
  error: apiErrorSchema,
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return apiErrorResponseSchema.safeParse(value).success;
}

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export const API_ERROR_CODES: ErrorCode[] = Object.values(ErrorCode);

export type ApiErrorCode = ErrorCode;

export const HTTP_STATUS_BY_ERROR_CODE = ErrorCodeToStatus;
