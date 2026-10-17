// Logique de gestion des propositions de documents par les étudiants
// et de leur modération par les administrateurs.

import { Readable } from "stream";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  documents,
  documentTypes,
  rejections,
  users,
  levels,
} from "@/server/db/schema";
import {
  CreateProposal,
  Proposal,
  ProposalFilters,
  ModerateProposal,
  PROPOSAL_RETENTION_DAYS,
} from "@/contracts/proposals";
import { PaginatedResponse } from "@/contracts/common";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/server/errors/http-errors";
import {
  storage,
  validateFile,
  validateFileHeader,
  ValidatedFileMeta,
} from "@/server/storage";
import { truncateText } from "@/server/utils/text";

const RETENTION_MS = PROPOSAL_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// Calcule les champs de rétention : le contenu d'une proposition non approuvée
// n'est disponible que pendant PROPOSAL_RETENTION_DAYS. Un document approuvé
// devient un document permanent (fichier conservé), donc toujours disponible.
function retentionFields(status: string, createdAt: Date) {
  const expiresAt = createdAt.getTime() + RETENTION_MS;
  const expired = Date.now() >= expiresAt;
  return {
    contentAvailable: status === "approved" ? true : !expired,
    fileExpiresAt: new Date(expiresAt).toISOString(),
  };
}

export const proposalsService = {
  // ── Soumission d'une proposition par un étudiant (Buffer ou Streaming) ─────
  async createProposal(
    userId: string,
    fileInput:
      | Buffer
      | {
          stream: Readable;
          filename: string;
          sizeBytes: number;
          headerBuffer: Buffer;
        },
    filename: string,
    input: CreateProposal
  ): Promise<Proposal> {
    let fileMeta: ValidatedFileMeta;
    let stream: Readable;

    if ("stream" in fileInput) {
      fileMeta = validateFileHeader(
        fileInput.headerBuffer,
        fileInput.filename,
        fileInput.sizeBytes
      );
      stream = fileInput.stream;
    } else {
      fileMeta = validateFile(fileInput, filename);
      stream = Readable.from(fileInput);
    }

    // Envoi du flux vers le stockage sans retenir 50 Mo en mémoire RAM
    await storage.put(stream, fileMeta.storageKey, fileMeta.mimeType);

    const [created] = await db
      .insert(documents)
      .values({
        title: input.title.trim(),
        description: input.description?.trim() ?? null,
        subject: input.subject.trim(),
        typeId: input.typeId,
        levelId: input.levelId ?? null,
        academicYear: input.academicYear ?? null,
        visibility: "students",
        status: "pending",
        fileKey: fileMeta.storageKey,
        originalFilename: fileMeta.originalFilename,
        mimeType: fileMeta.mimeType,
        sizeBytes: fileMeta.sizeBytes,
        uploadedBy: userId,
      })
      .returning();

    return this.getProposal(created.id, userId, false);
  },

  // ── Mes propositions (étudiant connecté) ──────────────────────────────────
  async listMyProposals(userId: string): Promise<Proposal[]> {
    const rows = await db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        subject: documents.subject,
        levelId: documents.levelId,
        levelName: levels.name,
        typeId: documents.typeId,
        typeName: documentTypes.name,
        academicYear: documents.academicYear,
        status: documents.status,
        visibility: documents.visibility,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        originalFilename: documents.originalFilename,
        uploaderName: users.fullName,
        createdAt: documents.createdAt,
        publishedAt: documents.publishedAt,
        rejectionReason: rejections.reason,
      })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
      .leftJoin(levels, eq(documents.levelId, levels.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .leftJoin(
        rejections,
        and(
          eq(rejections.targetId, documents.id),
          eq(rejections.targetType, "document")
        )
      )
      .where(eq(documents.uploadedBy, userId))
      .orderBy(desc(documents.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: truncateText(r.description),
      subject: r.subject,
      levelId: r.levelId,
      typeId: r.typeId,
      typeName: r.typeName,
      academicYear: r.academicYear,
      status: r.status,
      visibility: r.visibility,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      originalFilename: r.originalFilename,
      rejectionReason: r.rejectionReason,
      uploaderName: r.uploaderName ?? null,
      levelName: r.levelName ?? null,
      ...retentionFields(r.status, r.createdAt),
      createdAt: r.createdAt.toISOString(),
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }));
  },

  // ── Annulation d'une proposition par son propriétaire ─────────────────────
  async cancelProposal(
    userId: string,
    proposalId: string,
    isAdmin = false
  ): Promise<void> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, proposalId))
      .limit(1);

    if (!doc) {
      throw new NotFoundError("Proposition introuvable");
    }

    if (!isAdmin && doc.uploadedBy !== userId) {
      throw new ForbiddenError(
        "Vous n'avez pas le droit d'annuler cette proposition"
      );
    }

    if (!isAdmin && doc.status !== "pending") {
      throw new ForbiddenError(
        "Seules les propositions en attente peuvent être annulées"
      );
    }

    // Suppression en base enveloppée dans une transaction explicite
    await db.transaction(async (tx) => {
      await tx
        .delete(rejections)
        .where(
          and(
            eq(rejections.targetType, "document"),
            eq(rejections.targetId, proposalId)
          )
        );
      await tx.delete(documents).where(eq(documents.id, proposalId));
    });

    try {
      await storage.delete(doc.fileKey);
    } catch (err) {
      console.error("Échec de suppression du fichier physique :", err);
    }
  },

  // ── Liste des propositions pour l'administrateur ──────────────────────────
  async listAdminProposals(
    filters: ProposalFilters
  ): Promise<PaginatedResponse<Proposal>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const condition = eq(documents.status, filters.status);

    const [totalResult, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(documents)
        .where(condition),
      db
        .select({
          id: documents.id,
          title: documents.title,
          description: documents.description,
          subject: documents.subject,
          levelId: documents.levelId,
          typeId: documents.typeId,
          typeName: documentTypes.name,
          academicYear: documents.academicYear,
          status: documents.status,
          visibility: documents.visibility,
          mimeType: documents.mimeType,
          sizeBytes: documents.sizeBytes,
        originalFilename: documents.originalFilename,
        uploaderName: users.fullName,
        createdAt: documents.createdAt,
        publishedAt: documents.publishedAt,
        rejectionReason: rejections.reason,
        levelName: levels.name,
      })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
      .leftJoin(levels, eq(documents.levelId, levels.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .leftJoin(
        rejections,
        and(
          eq(rejections.targetId, documents.id),
          eq(rejections.targetType, "document")
        )
      )
      .where(condition)
        .orderBy(desc(documents.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const items: Proposal[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: truncateText(r.description),
      subject: r.subject,
      levelId: r.levelId,
      typeId: r.typeId,
      typeName: r.typeName,
      academicYear: r.academicYear,
      status: r.status,
      visibility: r.visibility,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      originalFilename: r.originalFilename,
      rejectionReason: r.rejectionReason,
      uploaderName: r.uploaderName ?? null,
      levelName: r.levelName ?? null,
      ...retentionFields(r.status, r.createdAt),
      createdAt: r.createdAt.toISOString(),
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }));

    return { items, page, pageSize, total };
  },

  // ── Modération d'une proposition par un administrateur ─────────────────────
  async moderateProposal(
    adminId: string,
    proposalId: string,
    input: ModerateProposal
  ): Promise<Proposal> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, proposalId))
      .limit(1);

    if (!doc) {
      throw new NotFoundError("Proposition introuvable");
    }

    if (input.action === "approve") {
      await db
        .update(documents)
        .set({
          status: "approved",
          publishedAt: new Date(),
          visibility: input.visibility ?? "students",
          ...(input.title ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() ?? null }
            : {}),
          ...(input.subject ? { subject: input.subject.trim() } : {}),
          ...(input.typeId ? { typeId: input.typeId } : {}),
          ...(input.levelId !== undefined ? { levelId: input.levelId } : {}),
          ...(input.academicYear !== undefined
            ? { academicYear: input.academicYear }
            : {}),
        })
        .where(eq(documents.id, proposalId));
    } else if (input.action === "reject") {
      if (!input.reason) {
        throw new ValidationError("Un motif est requis pour refuser une proposition");
      }

      await db
        .update(documents)
        .set({ status: "rejected" })
        .where(eq(documents.id, proposalId));

      await db.insert(rejections).values({
        targetType: "document",
        targetId: proposalId,
        reason: input.reason.trim(),
        createdBy: adminId,
      });
    } else {
      // Sans action : l'admin corrige seulement les métadonnées, le statut
      // et la visibilité restent inchangés.
      if (doc.status !== "pending") {
        throw new ForbiddenError(
          "Seules les propositions en attente peuvent être modifiées"
        );
      }

      await db
        .update(documents)
        .set({
          ...(input.title ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() ?? null }
            : {}),
          ...(input.subject ? { subject: input.subject.trim() } : {}),
          ...(input.typeId ? { typeId: input.typeId } : {}),
          ...(input.levelId !== undefined ? { levelId: input.levelId } : {}),
          ...(input.academicYear !== undefined
            ? { academicYear: input.academicYear }
            : {}),
        })
        .where(eq(documents.id, proposalId));
    }

    // Récupérer et retourner la proposition mise à jour
    const [updated] = await db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        subject: documents.subject,
        levelId: documents.levelId,
        levelName: levels.name,
        typeId: documents.typeId,
        typeName: documentTypes.name,
        academicYear: documents.academicYear,
        status: documents.status,
        visibility: documents.visibility,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        originalFilename: documents.originalFilename,
        uploaderName: users.fullName,
        createdAt: documents.createdAt,
        publishedAt: documents.publishedAt,
        rejectionReason: rejections.reason,
      })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
      .leftJoin(levels, eq(documents.levelId, levels.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .leftJoin(
        rejections,
        and(
          eq(rejections.targetId, documents.id),
          eq(rejections.targetType, "document")
        )
      )
      .where(eq(documents.id, proposalId))
      .limit(1);

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      subject: updated.subject,
      levelId: updated.levelId,
      typeId: updated.typeId,
      typeName: updated.typeName,
      academicYear: updated.academicYear,
      status: updated.status,
      visibility: updated.visibility,
      mimeType: updated.mimeType,
      sizeBytes: updated.sizeBytes,
      originalFilename: updated.originalFilename,
      rejectionReason: updated.rejectionReason,
      uploaderName: updated.uploaderName ?? null,
      levelName: updated.levelName ?? null,
      ...retentionFields(updated.status, updated.createdAt),
      createdAt: updated.createdAt.toISOString(),
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
    };
  },

  // ── Détail d'une proposition (propriétaire ou administrateur) ─────────────
  async getProposal(
    proposalId: string,
    userId?: string,
    isAdmin = false
  ): Promise<Proposal> {
    const rows = await db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        subject: documents.subject,
        levelId: documents.levelId,
        typeId: documents.typeId,
        typeName: documentTypes.name,
        academicYear: documents.academicYear,
        status: documents.status,
        visibility: documents.visibility,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        originalFilename: documents.originalFilename,
        uploadedBy: documents.uploadedBy,
        uploaderName: users.fullName,
        levelName: levels.name,
        createdAt: documents.createdAt,
        publishedAt: documents.publishedAt,
        rejectionReason: rejections.reason,
      })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
      .leftJoin(levels, eq(documents.levelId, levels.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .leftJoin(
        rejections,
        and(
          eq(rejections.targetId, documents.id),
          eq(rejections.targetType, "document")
        )
      )
      .where(eq(documents.id, proposalId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Proposition introuvable");
    }

    const item = rows[0];

    if (!isAdmin && item.uploadedBy !== userId) {
      throw new NotFoundError("Proposition introuvable");
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      subject: item.subject,
      levelId: item.levelId,
      typeId: item.typeId,
      typeName: item.typeName,
      academicYear: item.academicYear,
      status: item.status,
      visibility: item.visibility,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      originalFilename: item.originalFilename,
      rejectionReason: item.rejectionReason,
      uploaderName: item.uploaderName ?? null,
      levelName: item.levelName ?? null,
      ...retentionFields(item.status, item.createdAt),
      createdAt: item.createdAt.toISOString(),
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    };
  },

  // ── Mise à jour d'une proposition en attente par son auteur ────────────────
  async updateProposal(
    proposalId: string,
    userId: string,
    input: Partial<CreateProposal>,
    newFile?: {
      buffer?: Buffer;
      stream?: Readable;
      filename: string;
      sizeBytes?: number;
      headerBuffer?: Buffer;
    }
  ): Promise<Proposal> {
    const [existing] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, proposalId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Proposition introuvable");
    }

    if (existing.uploadedBy !== userId) {
      throw new ForbiddenError("Vous n'êtes pas le propriétaire de cette proposition");
    }

    if (existing.status !== "pending") {
      throw new ForbiddenError("Seules les propositions en attente peuvent être modifiées");
    }

    let fileUpdates: Partial<typeof documents.$inferInsert> = {};

    if (newFile) {
      let fileMeta: ValidatedFileMeta;
      let stream: Readable;

      if (newFile.buffer) {
        fileMeta = validateFile(newFile.buffer, newFile.filename);
        stream = Readable.from(newFile.buffer);
      } else if (newFile.stream && newFile.headerBuffer) {
        fileMeta = validateFileHeader(
          newFile.headerBuffer,
          newFile.filename,
          newFile.sizeBytes
        );
        stream = newFile.stream;
      } else {
        throw new ValidationError("Fichier manquant ou invalide");
      }

      await storage.put(stream, fileMeta.storageKey, fileMeta.mimeType);
      await storage.delete(existing.fileKey);

      fileUpdates = {
        fileKey: fileMeta.storageKey,
        originalFilename: fileMeta.originalFilename,
        mimeType: fileMeta.mimeType,
        sizeBytes: fileMeta.sizeBytes,
      };
    }

    await db
      .update(documents)
      .set({
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.subject ? { subject: input.subject.trim() } : {}),
        ...(input.typeId ? { typeId: input.typeId } : {}),
        ...(input.levelId !== undefined ? { levelId: input.levelId } : {}),
        ...(input.academicYear !== undefined
          ? { academicYear: input.academicYear }
          : {}),
        ...fileUpdates,
      })
      .where(eq(documents.id, proposalId));

    return this.getProposal(proposalId, userId, false);
  },

  // ── Téléchargement/Lecture du fichier d'une proposition ───────────────────
  async getProposalFile(
    proposalId: string,
    userId?: string,
    isAdmin = false
  ): Promise<{
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, proposalId))
      .limit(1);

    if (!doc) {
      throw new NotFoundError("Proposition introuvable");
    }

    if (!isAdmin && doc.uploadedBy !== userId) {
      throw new NotFoundError("Proposition introuvable");
    }

    // Rétention : hors admin, le fichier d'une proposition non approuvée
    // n'est plus servi après la période de rétention (rétention de 3 jours).
    if (!isAdmin && doc.status !== "approved") {
      if (Date.now() >= doc.createdAt.getTime() + RETENTION_MS) {
        throw new NotFoundError(
          "Le fichier de cette proposition a expiré après la période de rétention"
        );
      }
    }

    const fileStream = await storage.get(doc.fileKey);

    return {
      stream: fileStream,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
    };
  },
};
