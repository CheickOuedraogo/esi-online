// Enveloppe des route handlers Next.js : validation d'entrée, capture des exceptions,
// uniformisation des codes d'erreur et journalisation structurée des erreurs 5xx.

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/http-errors";
import { ErrorCode, ErrorCodeToStatus } from "@/contracts/errors";

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status, headers }
  );
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      "Données fournies invalides",
      ErrorCodeToStatus.VALIDATION_ERROR,
      fieldErrors as Record<string, string[]>
    );
  }

  if (error instanceof AppError) {
    return errorResponse(
      error.code,
      error.message,
      error.status,
      error.details
    );
  }

  // Erreur inattendue / non gérée (5xx)
  console.error("❌ Erreur serveur interne :", error);
  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    "Une erreur interne est survenue",
    ErrorCodeToStatus.INTERNAL_ERROR
  );
}

type RouteHandler<TContext = any> = (
  req: NextRequest,
  context: TContext
) => Promise<Response | NextResponse | unknown>;

export function apiHandler<TContext = any>(handler: RouteHandler<TContext>) {
  return async (req: NextRequest, context: TContext): Promise<Response> => {
    try {
      const result = await handler(req, context);
      if (result instanceof Response) {
        return result;
      }
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return handleRouteError(error);
    }
  };
}
