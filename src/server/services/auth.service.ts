// Logique d'authentification : inscription, connexion, déconnexion, demande de réinitialisation,
// et changement de mot de passe.

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, passwordResetRequests, levels } from "@/server/db/schema";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  RequestResetInput,
  UserPublic,
} from "@/contracts/auth";
import {
  ConflictError,
  UnauthenticatedError,
  AccountSuspendedError,
  ValidationError,
  NotFoundError,
} from "@/server/errors/http-errors";
import {
  hashPassword,
  verifyPassword,
} from "@/server/auth/password";
import {
  createSession,
  deleteSessionByToken,
  deleteAllUserSessions,
} from "@/server/auth/session";
import {
  checkLoginRateLimit,
  checkResetRateLimit,
} from "@/server/auth/rate-limit";

function toUserPublic(row: typeof users.$inferSelect): UserPublic {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    levelId: row.levelId,
    createdAt: row.createdAt.toISOString(),
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<UserPublic> {
    const email = input.email.toLowerCase();

    // Vérifie l'unicité de l'email
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Cet email est déjà associé à un compte");
    }

    // Vérifie que le niveau existe
    const levelExists = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.id, input.levelId))
      .limit(1);

    if (levelExists.length === 0) {
      throw new ValidationError("Niveau introuvable");
    }

    const passwordHash = await hashPassword(input.password);

    const [newUser] = await db
      .insert(users)
      .values({
        fullName: input.fullName.trim(),
        email,
        passwordHash,
        role: "student",
        status: "pending",
        mustChangePassword: false,
        levelId: input.levelId,
      })
      .returning();

    return toUserPublic(newUser);
  },

  async login(
    input: LoginInput,
    ip = "127.0.0.1",
    userAgent?: string | null
  ): Promise<{ user: UserPublic; token: string; expiresAt: Date }> {
    const email = input.email.toLowerCase();

    // Vérification du rate limit (5 tentatives par 15min)
    checkLoginRateLimit(ip, email);

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const genericAuthError = new UnauthenticatedError(
      "Adresse email ou mot de passe incorrect"
    );

    if (rows.length === 0) {
      throw genericAuthError;
    }

    const user = rows[0];

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw genericAuthError;
    }

    if (user.status === "suspended") {
      throw new AccountSuspendedError();
    }

    // Création de la session
    const { token, expiresAt } = await createSession(user.id, ip, userAgent);

    return {
      user: toUserPublic(user),
      token,
      expiresAt,
    };
  },

  async logout(token: string): Promise<void> {
    await deleteSessionByToken(token);
  },

  async requestReset(
    input: RequestResetInput,
    ip = "127.0.0.1"
  ): Promise<{ success: boolean }> {
    checkResetRateLimit(ip);

    const email = input.email.toLowerCase();
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (rows.length > 0) {
      const user = rows[0];
      // Enregistre la demande en attente
      await db.insert(passwordResetRequests).values({
        userId: user.id,
        status: "pending",
      });
    }

    // Toujours renvoyer un statut positif pour éviter le dénombrement d'utilisateurs
    return { success: true };
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    const user = rows[0];

    const isValid = await verifyPassword(
      user.passwordHash,
      input.currentPassword
    );
    if (!isValid) {
      throw new ValidationError("Le mot de passe actuel est incorrect");
    }

    const newHash = await hashPassword(input.newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Invalide toutes les autres sessions actives
    await deleteAllUserSessions(userId);
  },
};
