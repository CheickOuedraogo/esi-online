// GET - Liste des types de documents.
// POST - Création d'un type de document.
// Services : catalogService.listDocumentTypes / catalogService.createDocumentType. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { createDocumentTypeSchema } from "@/contracts/catalog";
import { catalogService } from "@/server/services/catalog.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const result = await catalogService.listDocumentTypes();
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const input = createDocumentTypeSchema.parse(body);

  const created = await catalogService.createDocumentType(input);
  return Response.json(created, { status: 201 });
});
