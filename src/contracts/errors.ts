// Format d'erreur unique de l'API : schema Zod et type d'erreur partages front/back.

import { z } from 'zod';

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'ACCOUNT_PENDING',
  'ACCOUNT_REJECTED',
  'ACCOUNT_SUSPENDED',
  'MUST_CHANGE_PASSWORD',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiErrorResponseSchema = z.object({
  error: apiErrorSchema,
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const HTTP_STATUS_BY_ERROR_CODE: Record<ApiErrorCode, number> = {
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

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return apiErrorResponseSchema.safeParse(value).success;
}
