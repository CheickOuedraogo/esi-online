import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  registerInputSchema,
  ErrorCodeToStatus,
  ErrorCode,
  documentFiltersSchema,
  updateUserStatusSchema,
} from "@/contracts";

describe("Contrats et Schémas Zod", () => {
  it("valide une inscription étudiante valide", () => {
    const valid = {
      fullName: "Amine Benali",
      email: "amine@esi.dz",
      password: "Password123!",
      programId: "123e4567-e89b-12d3-a456-426614174000",
      levelId: "123e4567-e89b-12d3-a456-426614174001",
    };

    const parsed = registerInputSchema.parse(valid);
    assert.equal(parsed.email, "amine@esi.dz");
  });

  it("rejette un mot de passe trop court (< 8 caractères)", () => {
    const invalid = {
      fullName: "Amine Benali",
      email: "amine@esi.dz",
      password: "short",
      programId: "123e4567-e89b-12d3-a456-426614174000",
      levelId: "123e4567-e89b-12d3-a456-426614174001",
    };

    assert.throws(() => registerInputSchema.parse(invalid));
  });

  it("vérifie les correspondances exactes des codes d'erreurs et des statuts HTTP", () => {
    assert.equal(ErrorCodeToStatus[ErrorCode.VALIDATION_ERROR], 400);
    assert.equal(ErrorCodeToStatus[ErrorCode.UNAUTHENTICATED], 401);
    assert.equal(ErrorCodeToStatus[ErrorCode.FORBIDDEN], 403);
    assert.equal(ErrorCodeToStatus[ErrorCode.ACCOUNT_PENDING], 403);
    assert.equal(ErrorCodeToStatus[ErrorCode.NOT_FOUND], 404);
    assert.equal(ErrorCodeToStatus[ErrorCode.CONFLICT], 409);
    assert.equal(ErrorCodeToStatus[ErrorCode.PAYLOAD_TOO_LARGE], 413);
    assert.equal(ErrorCodeToStatus[ErrorCode.UNSUPPORTED_MEDIA_TYPE], 415);
    assert.equal(ErrorCodeToStatus[ErrorCode.RATE_LIMITED], 429);
    assert.equal(ErrorCodeToStatus[ErrorCode.INTERNAL_ERROR], 500);
  });

  it("applique les valeurs par défaut de pagination et de tri sur les documents", () => {
    const filters = documentFiltersSchema.parse({});
    assert.equal(filters.page, 1);
    assert.equal(filters.pageSize, 20);
    assert.equal(filters.sort, "recent");
  });

  it("valide les données de modération et de changement de statut", () => {
    const statusChange = updateUserStatusSchema.parse({
      status: "validated",
    });
    assert.equal(statusChange.status, "validated");

    const rejection = updateUserStatusSchema.parse({
      status: "rejected",
      reason: "Document d'identité illisible",
    });
    assert.equal(rejection.reason, "Document d'identité illisible");
  });
});
