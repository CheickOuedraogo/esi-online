// Gestion des sessions en base de données et du cookie httpOnly sécurisé.

import crypto from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { UserPublic } from "@/contracts/auth";

export const SESSION_COOKIE_NAME = "esi_session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface SessionWithUser {
  sessionId: string;
  expiresAt: Date;
  user: UserPublic;
}

export async function createSession(
  userId: string,
  ip?: string | null,
  userAgent?: string | null
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  });

  return { token, expiresAt };
}

export async function getSessionUserByToken(
  token: string
): Promise<SessionWithUser | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const found = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      status: users.status,
      mustChangePassword: users.mustChangePassword,
      levelId: users.levelId,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  if (found.length === 0) {
    return null;
  }

  const row = found[0];
  return {
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
    user: {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      role: row.role,
      status: row.status,
      mustChangePassword: row.mustChangePassword,
      levelId: row.levelId,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getSessionFromCookies(): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }
  return getSessionUserByToken(cookie.value);
}

export function setSessionCookie(
  responseHeaders: Headers,
  token: string,
  expiresAt: Date
): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookieValue = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=${expiresAt.toUTCString()}`,
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  responseHeaders.append("Set-Cookie", cookieValue);
}

export function clearSessionCookie(responseHeaders: Headers): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookieValue = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  responseHeaders.append("Set-Cookie", cookieValue);
}
