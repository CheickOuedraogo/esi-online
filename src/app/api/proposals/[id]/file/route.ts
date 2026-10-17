// GET /api/proposals/:id/file : Téléchargement/Aperçu du fichier d'une proposition par son auteur (ou admin).

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { proposalsService } from "@/server/services/proposals.service";
import { requireValidatedStudent } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireValidatedStudent();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const fileData = await proposalsService.getProposalFile(
      id,
      user.id,
      user.role === "admin"
    );

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
