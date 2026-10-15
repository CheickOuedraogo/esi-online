// Logique de gestion des comptes utilisateurs par les administrateurs :
// recherche, validation, refus, suspension, réinitialisation de mot de passe et suppression.

import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  users,
  sessions,
  passwordResetRequests,
  rejections,
  documents,
  levels,
  programs,
} from "@/server/db/schema";
import {
  AdminUser,
  AdminUserFilters,
  UpdateUserStatus,
  ResetPasswordResponse,
  PasswordResetRequestItem,
} from "@/contracts/admin";
import { UserPublic } from "@/contracts/auth";
import { PaginatedResponse } from "@/contracts/common";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/server/errors/http-errors";
import {
  generateTemporaryPassword,
  hashPassword,
} from "@/server/auth/password";
import { deleteAllUserSessions } from "@/server/auth/session";
import { storage } from "@/server/storage";

function toUserPublic(row: typeof users.$inferSelect): UserPublic {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    programId: row.programId,
    levelId: row.levelId,
    createdAt: row.createdAt.toISOString(),
  };
}

function toAdminUser(
  row: (typeof users.$inferSelect) & {
    programName?: string | null;
    levelName?: string | null;
  }
): AdminUser {
  return {
    ...toUserPublic(row),
    programName: row.programName ?? null,
    levelName: row.levelName ?? null,
  };
}

export const usersService = {
  async listUsers(
    filters: AdminUserFilters
  ): Promise<PaginatedResponse<AdminUser>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (filters.status) {
      conditions.push(eq(users.status, filters.status));
    }

    if ((filters as any).role) {
      conditions.push(eq(users.role, (filters as any).role));
    }

    if (filters.q) {
      const searchPattern = `%${filters.q}%`;
      conditions.push(
        or(
          ilike(users.fullName, searchPattern),
          ilike(users.email, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, userRows] = await Promise.all([
      db
        .select({ total: count() })
        .from(users)
        .where(whereClause),
      db
        .select({
          u: users,
          programName: programs.name,
          levelName: levels.name,
        })
        .from(users)
        .leftJoin(programs, eq(users.programId, programs.id))
        .leftJoin(levels, eq(users.levelId, levels.id))
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      items: userRows.map((r) =>
        toAdminUser({ ...r.u, programName: r.programName, levelName: r.levelName })
      ),
      page,
      pageSize,
      total,
    };
  },

  // ── Utilisateur unique enrichi des noms de filière et de niveau ────────────
  async getAdminUser(userId: string): Promise<AdminUser> {
    const [row] = await db
      .select({
        u: users,
        programName: programs.name,
        levelName: levels.name,
      })
      .from(users)
      .leftJoin(programs, eq(users.programId, programs.id))
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    return toAdminUser({ ...row.u, programName: row.programName, levelName: row.levelName });
  },

  async updateUserStatus(
    adminId: string,
    targetUserId: string,
    input: UpdateUserStatus
  ): Promise<UserPublic> {
    if (adminId === targetUserId) {
      throw new ForbiddenError(
        "Un administrateur ne peut pas modifier son propre statut"
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    if (input.status === "rejected" && !input.reason) {
      throw new ValidationError(
        "Un motif est obligatoire pour refuser un compte"
      );
    }

    // Mise à jour du statut
    await db
      .update(users)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    // Enregistrement du motif si refus
    if (input.status === "rejected" && input.reason) {
      await db.insert(rejections).values({
        targetType: "user",
        targetId: targetUserId,
        reason: input.reason.trim(),
        createdBy: adminId,
      });
    }

    // Invalidation des sessions en cas de suspension ou refus
    if (input.status === "suspended" || input.status === "rejected") {
      await deleteAllUserSessions(targetUserId);
    }

    return this.getAdminUser(targetUserId);
  },

  async deleteUser(adminId: string, targetUserId: string): Promise<void> {
    if (adminId === targetUserId) {
      throw new ForbiddenError(
        "Un administrateur ne peut pas se supprimer lui-même"
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    // Ne pas supprimer le dernier admin
    if (targetUser.role === "admin") {
      const adminCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, "admin"));

      if ((adminCount[0]?.count ?? 0) <= 1) {
        throw new ForbiddenError(
          "Impossible de supprimer le dernier administrateur"
        );
      }
    }

    // Pour un étudiant : supprimer ses propositions non approuvées et leurs fichiers,
    // et détacher ses documents approuvés (uploaded_by = null)
    if (targetUser.role === "student") {
      const pendingOrRejectedDocs = await db
        .select({ id: documents.id, fileKey: documents.fileKey })
        .from(documents)
        .where(
          and(
            eq(documents.uploadedBy, targetUserId),
            or(eq(documents.status, "pending"), eq(documents.status, "rejected"))
          )
        );

      // Suppression en base enveloppée dans une transaction atomique explicite
      await db.transaction(async (tx) => {
        // Supprimer les motifs de rejets des propositions de l'utilisateur
        for (const doc of pendingOrRejectedDocs) {
          await tx
            .delete(rejections)
            .where(
              and(
                eq(rejections.targetType, "document"),
                eq(rejections.targetId, doc.id)
              )
            );
        }

        // Suppression des lignes de propositions non approuvées
        if (pendingOrRejectedDocs.length > 0) {
          await tx
            .delete(documents)
            .where(
              and(
                eq(documents.uploadedBy, targetUserId),
                or(
                  eq(documents.status, "pending"),
                  eq(documents.status, "rejected")
                )
              )
            );
        }

        // Conserver les documents approuvés en dissociant l'auteur
        await tx
          .update(documents)
          .set({ uploadedBy: null })
          .where(
            and(
              eq(documents.uploadedBy, targetUserId),
              eq(documents.status, "approved")
            )
          );

        // Invalider les sessions
        await tx.delete(sessions).where(eq(sessions.userId, targetUserId));

        // Supprimer les rejets de type utilisateur
        await tx
          .delete(rejections)
          .where(
            and(
              eq(rejections.targetType, "user"),
              eq(rejections.targetId, targetUserId)
            )
          );

        // Supprimer l'utilisateur
        await tx.delete(users).where(eq(users.id, targetUserId));
      });

      // Suppression des fichiers physiques après confirmation de la transaction
      for (const doc of pendingOrRejectedDocs) {
        try {
          await storage.delete(doc.fileKey);
        } catch (err) {
          console.error(
            `⚠️ Échec de suppression du fichier ${doc.fileKey} sur le disque :`,
            err
          );
        }
      }
    } else {
      // Invalider les sessions et supprimer l'utilisateur en transaction
      await db.transaction(async (tx) => {
        await tx.delete(sessions).where(eq(sessions.userId, targetUserId));
        await tx
          .delete(rejections)
          .where(
            and(
              eq(rejections.targetType, "user"),
              eq(rejections.targetId, targetUserId)
            )
          );
        await tx.delete(users).where(eq(users.id, targetUserId));
      });
    }
  },

  async resetPassword(
    adminId: string,
    targetUserId: string
  ): Promise<ResetPasswordResponse> {
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    const tempPassword = generateTemporaryPassword(14);
    const newHash = await hashPassword(tempPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    // Marquer les demandes éventuelles en attente comme traitées
    await db
      .update(passwordResetRequests)
      .set({
        status: "done",
        handledBy: adminId,
        handledAt: new Date(),
      })
      .where(
        and(
          eq(passwordResetRequests.userId, targetUserId),
          eq(passwordResetRequests.status, "pending")
        )
      );

    // Invalider toutes les sessions existantes
    await deleteAllUserSessions(targetUserId);

    return { temporaryPassword: tempPassword };
  },

  async listResetRequests(): Promise<PasswordResetRequestItem[]> {
    const rows = await db
      .select({
        id: passwordResetRequests.id,
        userId: passwordResetRequests.userId,
        userFullName: users.fullName,
        userEmail: users.email,
        status: passwordResetRequests.status,
        createdAt: passwordResetRequests.createdAt,
        handledAt: passwordResetRequests.handledAt,
      })
      .from(passwordResetRequests)
      .innerJoin(users, eq(passwordResetRequests.userId, users.id))
      .where(eq(passwordResetRequests.status, "pending"))
      .orderBy(desc(passwordResetRequests.createdAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userFullName: r.userFullName,
      userEmail: r.userEmail,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      handledAt: r.handledAt ? r.handledAt.toISOString() : null,
    }));
  },

  async createUserAdmin(input: {
    fullName: string;
    email: string;
    password?: string;
    role?: "student" | "admin";
    status?: "pending" | "validated" | "rejected" | "suspended";
    levelId?: string | null;
    programId?: string | null;
  }): Promise<UserPublic> {
    const email = input.email.toLowerCase();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new ValidationError("Cet email est déjà associé à un compte");
    }

    const passwordPlain = input.password || generateTemporaryPassword(14);
    const passwordHash = await hashPassword(passwordPlain);

    const [newUser] = await db
      .insert(users)
      .values({
        fullName: input.fullName.trim(),
        email,
        passwordHash,
        role: input.role ?? "student",
        status: input.status ?? "validated",
        mustChangePassword: !input.password,
        levelId: input.levelId ?? null,
        programId: input.programId ?? null,
      })
      .returning();

    return this.getAdminUser(newUser.id);
  },

  async handleResetRequest(
    adminId: string,
    requestId: string,
    explicitPassword?: string
  ): Promise<AdminUser> {
    const [request] = await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new NotFoundError("Demande de réinitialisation introuvable");
    }

    const tempPassword = explicitPassword || generateTemporaryPassword(14);
    const newHash = await hashPassword(tempPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, request.userId));

    await db
      .update(passwordResetRequests)
      .set({
        status: "done",
        handledBy: adminId,
        handledAt: new Date(),
      })
      .where(eq(passwordResetRequests.id, requestId));

    await deleteAllUserSessions(request.userId);

    return this.getAdminUser(request.userId);
  },
};
