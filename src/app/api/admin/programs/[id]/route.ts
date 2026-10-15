// PATCH - Mise à jour d'une filière.
// DELETE - Suppression d'une filière (avec contrôle de conflits).
// Services : catalogService.updateProgram / catalogService.deleteProgram. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { createProgramSchema } from "@/contracts/catalog";
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
    const input = createProgramSchema.parse(body);

    const updated = await catalogService.updateProgram(id, input);
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

    await catalogService.deleteProgram(id);

    return Response.json({ success: true }, { status: 200 });
  }
);
