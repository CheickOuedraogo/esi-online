// GET - Détail d'un document public.
// Entrée : paramètre id. Sortie : DocumentDetail (contracts/documents).
// Service : documentsService.getDetail. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { documentsService } from "@/server/services/documents.service";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);
    const detail = await documentsService.getDetail(id, null);
    return Response.json(detail, { status: 200 });
  }
);
