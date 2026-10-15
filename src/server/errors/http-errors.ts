// Classes d'erreurs HTTP standardisées avec code d'erreur et statut HTTP correspondant.

import { ErrorCode, ErrorCodeToStatus } from "@/contracts/errors";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ErrorCodeToStatus[code] ?? 500;
    this.details = details;
  }

  get statusCode(): number {
    return this.status;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Entrée invalide", details?: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentification requise") {
    super(ErrorCode.UNAUTHENTICATED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Action non autorisée") {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class AccountPendingError extends AppError {
  constructor(message = "Votre compte est en cours de validation par un administrateur") {
    super(ErrorCode.ACCOUNT_PENDING, message);
  }
}

export class AccountRejectedError extends AppError {
  constructor(message = "Votre compte a été refusé par l'administration") {
    super(ErrorCode.ACCOUNT_REJECTED, message);
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message = "Votre compte a été suspendu") {
    super(ErrorCode.ACCOUNT_SUSPENDED, message);
  }
}

export class MustChangePasswordError extends AppError {
  constructor(message = "Vous devez changer votre mot de passe temporaire avant de continuer") {
    super(ErrorCode.MUST_CHANGE_PASSWORD, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit avec une ressource existante") {
    super(ErrorCode.CONFLICT, message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Fichier trop volumineux") {
    super(ErrorCode.PAYLOAD_TOO_LARGE, message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Format de fichier non autorisé") {
    super(ErrorCode.UNSUPPORTED_MEDIA_TYPE, message);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Trop de requêtes, veuillez réessayer ultérieurement") {
    super(ErrorCode.RATE_LIMITED, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Une erreur interne est survenue") {
    super(ErrorCode.INTERNAL_ERROR, message);
  }
}
