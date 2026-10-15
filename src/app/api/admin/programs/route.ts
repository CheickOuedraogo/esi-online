// GET - Liste des filières.
// POST - Création d'une filière.
// Services : catalogService.listPrograms / catalogService.createProgram. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { createProgramSchema } from "@/contracts/catalog";
import { catalogService } from "@/server/services/catalog.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const result = await catalogService.listPrograms();
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const input = createProgramSchema.parse(body);

  const created = await catalogService.createProgram(input);
  return Response.json(created, { status: 201 });
});
