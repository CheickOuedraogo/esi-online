// GET - Liste publique des documents avec recherche et filtres simplifiés.
// Entrée : documentFiltersSchema (contracts/documents). Sortie : PaginatedResponse<DocumentSummary>.
// Service : documentsService.listPublic. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { documentFiltersSchema } from "@/contracts/documents";
import { documentsService } from "@/server/services/documents.service";

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const filters = documentFiltersSchema.parse(rawParams);

  const result = await documentsService.listPublic(filters);
  return Response.json(result, { status: 200 });
});
