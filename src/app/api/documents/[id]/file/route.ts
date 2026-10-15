// GET - Aperçu inline d'un document (sans incrément du compteur de téléchargement).
// Entrée : paramètre id. Sortie : flux du fichier avec Content-Disposition inline.
// Service : documentsService.openFile. Rôle : étudiant validé (ou admin).

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { documentsService } from "@/server/services/documents.service";
import { requireValidatedStudent } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireValidatedStudent();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const fileData = await documentsService.openFile(id, user);

    const webStream = Readable.toWeb(fileData.stream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": fileData.mimeType,
        "Content-Length": fileData.sizeBytes.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          fileData.originalFilename
        )}"`,
      },
    });
  }
);
