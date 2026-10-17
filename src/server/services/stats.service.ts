// Statistiques du tableau de bord administrateur :
// comptes et propositions en attente, totaux, et top téléchargements.

import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  users,
  documents,
  levels,
  documentTypes,
  passwordResetRequests,
} from "@/server/db/schema";
import { AdminStats } from "@/contracts/admin";
import { DocumentSummary } from "@/contracts/documents";
import { truncateText } from "@/server/utils/text";

export const statsService = {
  async getDashboardStats(): Promise<AdminStats> {
    const [
      pendingUsersRes,
      pendingProposalsRes,
      pendingResetRequestsRes,
      totalUsersRes,
      totalStudentsRes,
      totalDocsRes,
      totalDownloadsRes,
      topDocsRows,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .where(eq(users.status, "pending")),
      db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.status, "pending")),
      db
        .select({ count: count() })
        .from(passwordResetRequests)
        .where(eq(passwordResetRequests.status, "pending")),
      db.select({ count: count() }).from(users),
      db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, "student")),
      db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.status, "approved")),
      db
        .select({ total: sql<number>`coalesce(sum(${documents.downloadCount}), 0)` })
        .from(documents)
        .where(eq(documents.status, "approved")),
      db
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
          visibility: documents.visibility,
          status: documents.status,
          mimeType: documents.mimeType,
          sizeBytes: documents.sizeBytes,
          downloadCount: documents.downloadCount,
          createdAt: documents.createdAt,
          publishedAt: documents.publishedAt,
        })
        .from(documents)
        .innerJoin(documentTypes, eq(documents.typeId, documentTypes.id))
        .leftJoin(levels, eq(documents.levelId, levels.id))
        .where(eq(documents.status, "approved"))
        .orderBy(desc(documents.downloadCount), desc(documents.publishedAt))
        .limit(5),
    ]);

    const topDownloadedDocuments: DocumentSummary[] = topDocsRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: truncateText(r.description),
      subject: r.subject,
      levelId: r.levelId,
      levelName: r.levelName ?? null,
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

    return {
      pendingUsersCount: pendingUsersRes[0]?.count ?? 0,
      pendingProposalsCount: pendingProposalsRes[0]?.count ?? 0,
      pendingResetRequestsCount: pendingResetRequestsRes[0]?.count ?? 0,
      totalUsersCount: totalUsersRes[0]?.count ?? 0,
      totalStudentsCount: totalStudentsRes[0]?.count ?? 0,
      totalDocumentsCount: totalDocsRes[0]?.count ?? 0,
      totalDownloadsCount: Number(totalDownloadsRes[0]?.total ?? 0),
      topDownloadedDocuments,
    };
  },
};
