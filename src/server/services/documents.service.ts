// Logique métier des documents : listes (publique, étudiante, admin),
// recherche full-text / trigrammes, détail, téléchargement avec incrément atomique,
// et gestion administrateur (création, modification, suppression définitive).

import { Readable, PassThrough } from "stream";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  count,
  inArray,
} from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  documents,
  subjects,
  documentTypes,
  levels,
  programs,
  users,
  rejections,
} from "@/server/db/schema";
import {
  DocumentFilters,
  AdminDocumentFilters,
  DocumentSummary,
  DocumentDetail,
  CreateDocument,
  UpdateDocument,
} from "@/contracts/documents";
import { PaginatedResponse } from "@/contracts/common";
import { UserPublic } from "@/contracts/auth";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthenticatedError,
} from "@/server/errors/http-errors";
import {
  storage,
  validateFile,
  validateFileHeader,
  ValidatedFileMeta,
} from "@/server/storage";

export const documentsService = {
  // ── Liste des documents publics ───────────────────────────────────────────
  async listPublic(
    filters: DocumentFilters
  ): Promise<PaginatedResponse<DocumentSummary>> {
    return this.queryDocuments({
      ...filters,
      visibility: "public",
      status: "approved",
    });
  },

  // ── Liste des documents étudiants (publics et étudiants) ──────────────────
  async listStudent(
    filters: DocumentFilters
  ): Promise<PaginatedResponse<DocumentSummary>> {
    return this.queryDocuments({
      ...filters,
      status: "approved",
    });
  },

  // ── Liste des documents pour l'administrateur ────────────────────────────
  async listAdmin(
    filters: AdminDocumentFilters
  ): Promise<PaginatedResponse<DocumentSummary>> {
    return this.queryDocuments(filters);
  },

  // ── Moteur de recherche et requête générique ──────────────────────────────
  async queryDocuments(
    filters: AdminDocumentFilters
  ): Promise<PaginatedResponse<DocumentSummary>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (filters.status) {
      conditions.push(eq(documents.status, filters.status));
    }

    if (filters.visibility) {
      conditions.push(eq(documents.visibility, filters.visibility));
    }

    if (filters.subjectId) {
      conditions.push(eq(documents.subjectId, filters.subjectId));
    }

    if (filters.typeId) {
      conditions.push(eq(documents.typeId, filters.typeId));
    }

    if (filters.year) {
      conditions.push(eq(documents.academicYear, filters.year));
    }

    if (filters.levelId) {
      conditions.push(eq(subjects.levelId, filters.levelId));
    }

    if (filters.programId) {
      conditions.push(eq(subjects.programId, filters.programId));
    }

    // Recherche par mots-clés : Full-text français tsvector + trigrammes pg_trgm + ILIKE
    if (filters.q && filters.q.trim().length > 0) {
      const qClean = filters.q.trim();
      const searchPattern = `%${qClean}%`;
      conditions.push(
        or(
          sql`${documents.searchVector} @@ plainto_tsquery('french', ${qClean})`,
          sql`${documents.title} % ${qClean}`,
          ilike(documents.title, searchPattern),
          ilike(documents.description, searchPattern),
          ilike(subjects.name, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Ordre de tri
    const orderByClause = [];
    if (filters.sort === "popular") {
      orderByClause.push(
        desc(documents.downloadCount),
        desc(documents.publishedAt)
      );
    } else if (filters.sort === "title") {
      orderByClause.push(asc(documents.title));
    } else {
      // Si une requête texte est présente sans tri explicite, on priorise la pertinence plein-texte
      if (filters.q && filters.q.trim().length > 0) {
        orderByClause.push(
          desc(
            sql`ts_rank(${documents.searchVector}, plainto_tsquery('french', ${filters.q.trim()}))`
          )
        );
      }
      // Par défaut : plus récent
      orderByClause.push(desc(documents.publishedAt), desc(documents.createdAt));
    }

    const [totalResult, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(documents)
        .innerJoin(subjects, eq(documents.subjectId, subjects.id))
        .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
        .where(whereClause),
      db
        .select({
          id: documents.id,
          title: documents.title,
          description: documents.description,
          subjectId: documents.subjectId,
          subjectName: subjects.name,
          typeId: documents.typeId,
          typeName: documentTypes.name,
          academicYear: documents.academicYear,
          visibility: documents.visibility,
          status: documents.status,
          mimeType: documents.mimeType,
          sizeBytes: documents.sizeBytes,
          downloadCount: documents.downloadCount,
          createdAt: documents.createdAt,
          publishedAt: documents.publishedAt,
        })
        .from(documents)
        .innerJoin(subjects, eq(documents.subjectId, subjects.id))
        .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const items: DocumentSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      subjectId: r.subjectId,
      subjectName: r.subjectName,
      typeId: r.typeId,
      typeName: r.typeName,
      academicYear: r.academicYear,
      visibility: r.visibility,
      status: r.status,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      downloadCount: r.downloadCount,
      createdAt: r.createdAt.toISOString(),
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }));

    return { items, page, pageSize, total };
  },

  // ── Détail d'un document ──────────────────────────────────────────────────
  async getDetail(
    id: string,
    currentUser?: UserPublic | null
  ): Promise<DocumentDetail> {
    const rows = await db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        subjectId: documents.subjectId,
        subjectName: subjects.name,
        levelId: subjects.levelId,
        levelName: levels.name,
        programId: subjects.programId,
        programName: programs.name,
        typeId: documents.typeId,
        typeName: documentTypes.name,
        academicYear: documents.academicYear,
        visibility: documents.visibility,
        status: documents.status,
        originalFilename: documents.originalFilename,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        uploadedBy: documents.uploadedBy,
        uploaderName: users.fullName,
        downloadCount: documents.downloadCount,
        createdAt: documents.createdAt,
        publishedAt: documents.publishedAt,
      })
      .from(documents)
      .innerJoin(subjects, eq(documents.subjectId, subjects.id))
      .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
      .leftJoin(levels, eq(subjects.levelId, levels.id))
      .leftJoin(programs, eq(subjects.programId, programs.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(eq(documents.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Document introuvable");
    }

    const doc = rows[0];

    // Règles de visibilité
    if (!currentUser || currentUser.role !== "admin") {
      if (doc.status !== "approved") {
        throw new NotFoundError("Document introuvable");
      }
      if (!currentUser && doc.visibility !== "public") {
        throw new NotFoundError("Document introuvable");
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      subjectId: doc.subjectId,
      subjectName: doc.subjectName,
      levelId: doc.levelId,
      levelName: doc.levelName,
      programId: doc.programId,
      programName: doc.programName,
      typeId: doc.typeId,
      typeName: doc.typeName,
      academicYear: doc.academicYear,
      visibility: doc.visibility,
      status: doc.status,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedBy: doc.uploadedBy,
      uploaderName: doc.uploaderName,
      downloadCount: doc.downloadCount,
      createdAt: doc.createdAt.toISOString(),
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    };
  },

  // ── Incrément atomique du compteur de téléchargement ───────────────────────
  async recordDownload(id: string): Promise<void> {
    await db
      .update(documents)
      .set({
        downloadCount: sql`${documents.downloadCount} + 1`,
      })
      .where(eq(documents.id, id));
  },

  // ── Vérification d'accès et ouverture du flux pour un document ──────────────
  // Factorisé entre le téléchargement (avec compteur) et l'aperçu inline.
  async openFile(
    id: string,
    currentUser?: UserPublic | null
  ): Promise<{
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc) {
      throw new NotFoundError("Document introuvable");
    }

    if (doc.status !== "approved") {
      if (!currentUser || currentUser.role !== "admin") {
        throw new NotFoundError("Document introuvable");
      }
    }

    // Si le document est réservé aux étudiants, vérification de session et statut
    if (doc.visibility === "students") {
      if (!currentUser) {
        throw new UnauthenticatedError(
          "Un compte étudiant validé est requis pour accéder à ce document"
        );
      }
      if (currentUser.role !== "admin" && currentUser.status !== "validated") {
        throw new ForbiddenError("Votre compte n'est pas validé");
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

  // ── Téléchargement avec streaming et incrément atomique après succès ────────
  async getDownload(
    id: string,
    currentUser?: UserPublic | null
  ): Promise<{
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const fileData = await this.openFile(id, currentUser);

    // Incrément atomique uniquement si l'envoi du flux au client se termine avec succès
    const trackingStream = new PassThrough();
    fileData.stream.pipe(trackingStream);
    trackingStream.on("finish", () => {
      this.recordDownload(id).catch((err) => {
        console.error(`⚠️ Échec incrémentation compteur pour le document ${id} :`, err);
      });
    });

    return {
      ...fileData,
      stream: trackingStream,
    };
  },

  // ── Création directe par un administrateur (support Buffer ou Streaming) ────
  async createAdmin(
    adminId: string,
    fileInput:
      | Buffer
      | {
          stream: Readable;
          filename: string;
          sizeBytes: number;
          headerBuffer: Buffer;
        },
    filename: string,
    meta: CreateDocument
  ): Promise<DocumentDetail> {
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

    // Envoi du flux vers le stockage (pas de rétention de 50 Mo en RAM)
    await storage.put(stream, fileMeta.storageKey, fileMeta.mimeType);

    const [created] = await db
      .insert(documents)
      .values({
        title: meta.title.trim(),
        description: meta.description?.trim() ?? null,
        subjectId: meta.subjectId,
        typeId: meta.typeId,
        academicYear: meta.academicYear ?? null,
        visibility: meta.visibility ?? "students",
        status: "approved",
        publishedAt: new Date(),
        uploadedBy: adminId,
        fileKey: fileMeta.storageKey,
        originalFilename: fileMeta.originalFilename,
        mimeType: fileMeta.mimeType,
        sizeBytes: fileMeta.sizeBytes,
      })
      .returning();

    return this.getDetail(created.id);
  },

  // ── Modification par un administrateur (support Buffer ou Streaming) ────────
  async updateAdmin(
    id: string,
    meta: UpdateDocument,
    newFile?: {
      buffer?: Buffer;
      stream?: Readable;
      filename: string;
      sizeBytes?: number;
      headerBuffer?: Buffer;
    }
  ): Promise<DocumentDetail> {
    const [existing] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Document introuvable");
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

      // Supprime l'ancien fichier
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
        ...(meta.title ? { title: meta.title.trim() } : {}),
        ...(meta.description !== undefined
          ? { description: meta.description?.trim() ?? null }
          : {}),
        ...(meta.subjectId ? { subjectId: meta.subjectId } : {}),
        ...(meta.typeId ? { typeId: meta.typeId } : {}),
        ...(meta.academicYear !== undefined
          ? { academicYear: meta.academicYear }
          : {}),
        ...(meta.visibility ? { visibility: meta.visibility } : {}),
        ...fileUpdates,
      })
      .where(eq(documents.id, id));

    return this.getDetail(id);
  },

  // ── Suppression définitive par un administrateur (en transaction explicite) ─
  async deleteAdmin(id: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Document introuvable");
    }

    // Suppression en base enveloppée dans une transaction explicite
    await db.transaction(async (tx) => {
      await tx
        .delete(rejections)
        .where(
          and(eq(rejections.targetType, "document"), eq(rejections.targetId, id))
        );
      await tx.delete(documents).where(eq(documents.id, id));
    });

    // Suppression physique du fichier avec journalisation d'erreur en cas d'échec
    try {
      await storage.delete(existing.fileKey);
    } catch (err) {
      console.error(
        `⚠️ Échec de suppression du fichier ${existing.fileKey} sur le disque :`,
        err
      );
    }
  },
};

