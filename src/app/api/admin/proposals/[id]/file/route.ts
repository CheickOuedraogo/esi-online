// GET /api/admin/proposals/:id/file : Aperçu/Téléchargement du fichier soumis pour modération par l'administrateur.

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { proposalsService } from "@/server/services/proposals.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const fileData = await proposalsService.getProposalFile(id, undefined, true);

    const webStream = Readable.toWeb(fileData.stream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": fileData.mimeType,
        "Content-Length": fileData.sizeBytes.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          fileData.originalFilename
        )}"`,
      },
    });
  }
);
