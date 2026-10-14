// Limitation de débit (rate limiting) en mémoire pour les routes sensibles.
// Conforme au cahier des charges : 5 tentatives de connexion par 15 min par IP+email,
// et 3 demandes de réinitialisation par heure par IP.

import { RateLimitedError } from "@/server/errors/http-errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    throw new RateLimitedError();
  }

  entry.count += 1;
}

export function checkLoginRateLimit(ip: string, email: string): void {
  const key = `login:${ip}:${email.toLowerCase()}`;
  checkRateLimit(key, 5, 15 * 60 * 1000); // 5 tentatives par 15 minutes
}

export function checkResetRateLimit(ip: string): void {
  const key = `reset:${ip}`;
  checkRateLimit(key, 3, 60 * 60 * 1000); // 3 demandes par heure
}
