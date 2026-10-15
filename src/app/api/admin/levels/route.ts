// GET - Liste des niveaux.
// POST - Création d'un niveau.
// Services : catalogService.listLevels / catalogService.createLevel. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { createLevelSchema } from "@/contracts/catalog";
import { catalogService } from "@/server/services/catalog.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const result = await catalogService.listLevels();
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const input = createLevelSchema.parse(body);

  const created = await catalogService.createLevel(input);
  return Response.json(created, { status: 201 });
});
