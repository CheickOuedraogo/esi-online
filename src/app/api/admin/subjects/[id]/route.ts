// PATCH - Mise à jour d'une matière.
// DELETE - Suppression d'une matière (avec contrôle de conflits).
// Services : catalogService.updateSubject / catalogService.deleteSubject. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { createSubjectSchema } from "@/contracts/catalog";
import { catalogService } from "@/server/services/catalog.service";
import { requireAdmin } from "@/server/auth/guards";

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const body = await req.json();
    const input = createSubjectSchema.partial().parse(body);

    const updated = await catalogService.updateSubject(id, input);
    return Response.json(updated, { status: 200 });
  }
);

export const DELETE = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    await catalogService.deleteSubject(id);

    return Response.json({ success: true }, { status: 200 });
  }
);
