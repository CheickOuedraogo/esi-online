import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  generateTemporaryPassword,
} from "@/server/auth/password";
import { hashToken, generateSessionToken } from "@/server/auth/session";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { RateLimitedError } from "@/server/errors/http-errors";

describe("Authentification & Sécurité", () => {
  it("hache et vérifie un mot de passe avec argon2id", async () => {
    const password = "MonMotDePasseSecret123!";
    const hash = await hashPassword(password);

    assert.ok(hash.startsWith("$argon2id$"));

    const isMatch = await verifyPassword(hash, password);
    assert.equal(isMatch, true);

    const isBadMatch = await verifyPassword(hash, "MauvaisMotDePasse");
    assert.equal(isBadMatch, false);
  });

  it("génère des mots de passe temporaires aléatoires conformes", () => {
    const pass1 = generateTemporaryPassword(14);
    const pass2 = generateTemporaryPassword(14);

    assert.equal(pass1.length, 14);
    assert.equal(pass2.length, 14);
    assert.notEqual(pass1, pass2);
  });

  it("hache les jetons de session en SHA-256 de façon déterministe", () => {
    const token = generateSessionToken();
    assert.equal(token.length, 64); // 32 octets en hex

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  it("bloque les requêtes au-delà du quota de rate limit", () => {
    const key = `test-ip-${Date.now()}`;
    // 3 essais autorisés
    checkRateLimit(key, 3, 5000);
    checkRateLimit(key, 3, 5000);
    checkRateLimit(key, 3, 5000);

    // Le 4ème doit lever RateLimitedError
    assert.throws(
      () => {
        checkRateLimit(key, 3, 5000);
      },
      (err: any) => err instanceof RateLimitedError
    );
  });
});
