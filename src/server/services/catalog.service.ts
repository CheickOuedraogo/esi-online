// Logique métier du catalogue académique : consultation publique et CRUD admin
// avec contrôles d'intégrité référentielle (rejet CONFLICT si l'élément est utilisé).

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  levels,
  programs,
  subjects,
  documentTypes,
  documents,
  users,
} from "@/server/db/schema";
import {
  CatalogResponse,
  Level,
  Program,
  Subject,
  DocumentType,
  CreateLevel,
  CreateProgram,
  CreateSubject,
  CreateDocumentType,
} from "@/contracts/catalog";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/http-errors";

export const catalogService = {
  // ── Consultation globale (publique) ───────────────────────────────────────
  async getFullCatalog(): Promise<CatalogResponse> {
    const [allLevels, allPrograms, allSubjects, allDocTypes] =
      await Promise.all([
        db.select().from(levels).orderBy(levels.name),
        db.select().from(programs).orderBy(programs.name),
        db.select().from(subjects).orderBy(subjects.name),
        db.select().from(documentTypes).orderBy(documentTypes.name),
      ]);

    return {
      levels: allLevels,
      programs: allPrograms,
      subjects: allSubjects,
      documentTypes: allDocTypes,
    };
  },

  // ── Niveaux (Levels) ──────────────────────────────────────────────────────
  async listLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.name);
  },

  async createLevel(input: CreateLevel): Promise<Level> {
    const existing = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.name, input.name.trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Ce niveau existe déjà");
    }

    const [created] = await db
      .insert(levels)
      .values({ name: input.name.trim() })
      .returning();

    return created;
  },

  async updateLevel(id: string, input: CreateLevel): Promise<Level> {
    const existing = await db
      .select()
      .from(levels)
      .where(eq(levels.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError("Niveau introuvable");
    }

    const [updated] = await db
      .update(levels)
      .set({ name: input.name.trim() })
      .where(eq(levels.id, id))
      .returning();

    return updated;
  },

  async deleteLevel(id: string): Promise<void> {
    // Vérification de dépendances dans subjects
    const usedInSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.levelId, id))
      .limit(1);

    if (usedInSubjects.length > 0) {
      throw new ConflictError(
        "Ce niveau ne peut être supprimé car il est utilisé par des matières"
      );
    }

    // Vérification de dépendances dans users
    const usedInUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.levelId, id))
      .limit(1);

    if (usedInUsers.length > 0) {
      throw new ConflictError(
        "Ce niveau ne peut être supprimé car il est assigné à des utilisateurs"
      );
    }

    const result = await db.delete(levels).where(eq(levels.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundError("Niveau introuvable");
    }
  },

  // ── Filières (Programs) ───────────────────────────────────────────────────
  async listPrograms(): Promise<Program[]> {
    return db.select().from(programs).orderBy(programs.name);
  },

  async createProgram(input: CreateProgram): Promise<Program> {
    const existing = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.name, input.name.trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Cette filière existe déjà");
    }

    const [created] = await db
      .insert(programs)
      .values({ name: input.name.trim() })
      .returning();

    return created;
  },

  async updateProgram(id: string, input: CreateProgram): Promise<Program> {
    const existing = await db
      .select()
      .from(programs)
      .where(eq(programs.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError("Filière introuvable");
    }

    const [updated] = await db
      .update(programs)
      .set({ name: input.name.trim() })
      .where(eq(programs.id, id))
      .returning();

    return updated;
  },

  async deleteProgram(id: string): Promise<void> {
    const usedInSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.programId, id))
      .limit(1);

    if (usedInSubjects.length > 0) {
      throw new ConflictError(
        "Cette filière ne peut être supprimée car elle est utilisée par des matières"
      );
    }

    const usedInUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.programId, id))
      .limit(1);

    if (usedInUsers.length > 0) {
      throw new ConflictError(
        "Cette filière ne peut être supprimée car elle est assignée à des utilisateurs"
      );
    }

    const result = await db
      .delete(programs)
      .where(eq(programs.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Filière introuvable");
    }
  },

  // ── Matières (Subjects) ───────────────────────────────────────────────────
  async listSubjects(): Promise<Subject[]> {
    return db.select().from(subjects).orderBy(subjects.name);
  },

  async createSubject(input: CreateSubject): Promise<Subject> {
    let programId = input.programId;
    if (!programId) {
      const [firstProg] = await db.select({ id: programs.id }).from(programs).limit(1);
      if (!firstProg) {
        throw new ValidationError("Aucune filière configurée");
      }
      programId = firstProg.id;
    }

    const [levelExists, programExists] = await Promise.all([
      db
        .select({ id: levels.id })
        .from(levels)
        .where(eq(levels.id, input.levelId))
        .limit(1),
      db
        .select({ id: programs.id })
        .from(programs)
        .where(eq(programs.id, programId))
        .limit(1),
    ]);

    if (levelExists.length === 0 || programExists.length === 0) {
      throw new ValidationError("Niveau ou filière spécifié introuvable");
    }

    const [created] = await db
      .insert(subjects)
      .values({
        name: input.name.trim(),
        levelId: input.levelId,
        programId,
      })
      .returning();

    return created;
  },

  async updateSubject(
    id: string,
    input: Partial<CreateSubject>
  ): Promise<Subject> {
    const existing = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError("Matière introuvable");
    }

    if (input.levelId) {
      const level = await db
        .select({ id: levels.id })
        .from(levels)
        .where(eq(levels.id, input.levelId))
        .limit(1);
      if (level.length === 0) throw new ValidationError("Niveau introuvable");
    }

    if (input.programId) {
      const prog = await db
        .select({ id: programs.id })
        .from(programs)
        .where(eq(programs.id, input.programId))
        .limit(1);
      if (prog.length === 0) throw new ValidationError("Filière introuvable");
    }

    const [updated] = await db
      .update(subjects)
      .set({
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.levelId ? { levelId: input.levelId } : {}),
        ...(input.programId ? { programId: input.programId } : {}),
      })
      .where(eq(subjects.id, id))
      .returning();

    return updated;
  },

  async deleteSubject(id: string): Promise<void> {
    const usedInDocs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.subjectId, id))
      .limit(1);

    if (usedInDocs.length > 0) {
      throw new ConflictError(
        "Cette matière ne peut être supprimée car elle est utilisée par des documents"
      );
    }

    const result = await db
      .delete(subjects)
      .where(eq(subjects.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Matière introuvable");
    }
  },

  // ── Types de documents (DocumentTypes) ────────────────────────────────────
  async listDocumentTypes(): Promise<DocumentType[]> {
    return db.select().from(documentTypes).orderBy(documentTypes.name);
  },

  async createDocumentType(input: CreateDocumentType): Promise<DocumentType> {
    const existing = await db
      .select({ id: documentTypes.id })
      .from(documentTypes)
      .where(eq(documentTypes.name, input.name.trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Ce type de document existe déjà");
    }

    const [created] = await db
      .insert(documentTypes)
      .values({ name: input.name.trim() })
      .returning();

    return created;
  },

  async updateDocumentType(
    id: string,
    input: CreateDocumentType
  ): Promise<DocumentType> {
    const existing = await db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError("Type de document introuvable");
    }

    const [updated] = await db
      .update(documentTypes)
      .set({ name: input.name.trim() })
      .where(eq(documentTypes.id, id))
      .returning();

    return updated;
  },

  async deleteDocumentType(id: string): Promise<void> {
    const usedInDocs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.typeId, id))
      .limit(1);

    if (usedInDocs.length > 0) {
      throw new ConflictError(
        "Ce type de document ne peut être supprimé car il est utilisé par des documents"
      );
    }

    const result = await db
      .delete(documentTypes)
      .where(eq(documentTypes.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Type de document introuvable");
    }
  },
};
