// GET - Lecture du catalogue complet (niveaux, filières, matières, types de documents).
// Entrée : aucune. Sortie : CatalogResponse (contracts/catalog).
// Service : catalogService.getFullCatalog. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { catalogService } from "@/server/services/catalog.service";

export const GET = apiHandler(async (_req: NextRequest) => {
  const catalog = await catalogService.getFullCatalog();
  return Response.json(catalog, { status: 200 });
});
