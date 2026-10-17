// Logique métier du catalogue académique : consultation publique et CRUD admin
// avec contrôles d'intégrité référentielle (rejet CONFLICT si l'élément est utilisé).
// L'ESI est une école unique : pas de filière ni de table de matières.

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { levels, documentTypes, documents, users } from "@/server/db/schema";
import {
  CatalogResponse,
  Level,
  DocumentType,
  CreateLevel,
  CreateDocumentType,
} from "@/contracts/catalog";
import {
  ConflictError,
  NotFoundError,
} from "@/server/errors/http-errors";

// Cache mémoire du catalogue complet. Le catalogue change rarement mais est lu à
// chaque chargement de la bibliothèque et de formulaires d'administration : le
// mettre en cache évite des requêtes répétées et réduit la charge de la base.
// Toute mutation invalide le cache pour garantir la fraîcheur des données.
const CATALOG_TTL_MS = 30_000;
let catalogCache: { data: CatalogResponse; expiresAt: number } | null = null;

function invalidateCatalogCache(): void {
  catalogCache = null;
}

export const catalogService = {
  // ── Consultation globale (publique) ───────────────────────────────────────
  async getFullCatalog(): Promise<CatalogResponse> {
    const now = Date.now();
    if (catalogCache && catalogCache.expiresAt > now) {
      return catalogCache.data;
    }

    const [allLevels, allDocTypes] = await Promise.all([
      db.select().from(levels).orderBy(levels.name),
      db.select().from(documentTypes).orderBy(documentTypes.name),
    ]);

    const data: CatalogResponse = {
      levels: allLevels,
      documentTypes: allDocTypes,
    };

    catalogCache = { data, expiresAt: now + CATALOG_TTL_MS };
    return data;
  },

  // ── Niveaux (Levels) ──────────────────────────────────────────────────────
  async listLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.name);
  },

  async createLevel(input: CreateLevel): Promise<Level> {
    invalidateCatalogCache();
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
    invalidateCatalogCache();
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
    invalidateCatalogCache();

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

    // Vérification de dépendances dans documents
    const usedInDocuments = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.levelId, id))
      .limit(1);

    if (usedInDocuments.length > 0) {
      throw new ConflictError(
        "Ce niveau ne peut être supprimé car il est utilisé par des documents"
      );
    }

    const result = await db.delete(levels).where(eq(levels.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundError("Niveau introuvable");
    }
  },

  // ── Types de documents (DocumentTypes) ────────────────────────────────────
  async listDocumentTypes(): Promise<DocumentType[]> {
    return db.select().from(documentTypes).orderBy(documentTypes.name);
  },

  async createDocumentType(input: CreateDocumentType): Promise<DocumentType> {
    invalidateCatalogCache();
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
    invalidateCatalogCache();
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
    invalidateCatalogCache();
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
