// Gardes d'accès : requireAuth, requireRole, requireValidatedStudent.
// Utilisables directement dans les services ou les route handlers.

import {
  UnauthenticatedError,
  ForbiddenError,
  AccountPendingError,
  AccountRejectedError,
  AccountSuspendedError,
  MustChangePasswordError,
} from "@/server/errors/http-errors";
import { getSessionFromCookies } from "./session";
import { UserPublic } from "@/contracts/auth";

export async function requireAuth(
  options: { allowMustChangePassword?: boolean } = {}
): Promise<UserPublic> {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new UnauthenticatedError();
  }

  const { user } = session;

  if (user.status === "suspended") {
    throw new AccountSuspendedError();
  }

  if (user.mustChangePassword && !options.allowMustChangePassword) {
    throw new MustChangePasswordError();
  }

  return user;
}

export async function requireRole(role: "admin" | "student"): Promise<UserPublic> {
  const user = await requireAuth();

  if (user.role !== role) {
    throw new ForbiddenError("Droits insuffisants");
  }

  return user;
}

export async function requireAdmin(): Promise<UserPublic> {
  return requireRole("admin");
}

export async function requireValidatedStudent(): Promise<UserPublic> {
  const user = await requireAuth();

  // Les administrateurs ont accès à tout
  if (user.role === "admin") {
    return user;
  }

  if (user.status === "pending") {
    throw new AccountPendingError();
  }

  if (user.status === "rejected") {
    throw new AccountRejectedError();
  }

  if (user.status !== "validated") {
    throw new ForbiddenError("Compte non validé");
  }

  return user;
}
