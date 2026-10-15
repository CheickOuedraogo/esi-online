// GET - Aperçu inline d'un document public (accessible sans compte pour les documents publics).
// Entrée : paramètre id. Sortie : flux de fichier avec Content-Disposition inline.
// Service : documentsService.openFile. Rôle : public (session optionnelle).

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { documentsService } from "@/server/services/documents.service";
import { getSessionFromCookies } from "@/server/auth/session";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const session = await getSessionFromCookies();
    const currentUser = session?.user ?? null;

    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const fileData = await documentsService.openFile(id, currentUser);

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
