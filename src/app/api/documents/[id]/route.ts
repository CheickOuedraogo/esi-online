// GET - Détail d'un document pour un étudiant validé.
// Entrée : paramètre id. Sortie : DocumentDetail (contracts/documents).
// Service : documentsService.getDetail. Rôle : étudiant validé (ou admin).

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

    const detail = await documentsService.getDetail(id, user);
    return Response.json(detail, { status: 200 });
  }
);
