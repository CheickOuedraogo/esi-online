// GET - Liste complète des documents pour les étudiants validés.
// Entrée : documentFiltersSchema (contracts/documents). Sortie : PaginatedResponse<DocumentSummary>.
// Service : documentsService.listStudent. Rôle : étudiant validé (ou admin).

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { documentFiltersSchema } from "@/contracts/documents";
import { documentsService } from "@/server/services/documents.service";
import { requireValidatedStudent } from "@/server/auth/guards";

export const GET = apiHandler(async (req: NextRequest) => {
  await requireValidatedStudent();

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const filters = documentFiltersSchema.parse(rawParams);

  const result = await documentsService.listStudent(filters);
  return Response.json(result, { status: 200 });
});
