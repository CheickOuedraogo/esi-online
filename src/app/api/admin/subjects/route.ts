// GET - Liste des matières.
// POST - Création d'une matière.
// Services : catalogService.listSubjects / catalogService.createSubject. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { createSubjectSchema } from "@/contracts/catalog";
import { catalogService } from "@/server/services/catalog.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const result = await catalogService.listSubjects();
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const input = createSubjectSchema.parse(body);

  const created = await catalogService.createSubject(input);
  return Response.json(created, { status: 201 });
});
