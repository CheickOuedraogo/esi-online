// PATCH - Mise à jour d'un niveau.
// DELETE - Suppression d'un niveau (avec contrôle de conflits).
// Services : catalogService.updateLevel / catalogService.deleteLevel. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { createLevelSchema } from "@/contracts/catalog";
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
    const input = createLevelSchema.parse(body);

    const updated = await catalogService.updateLevel(id, input);
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

    await catalogService.deleteLevel(id);

    return Response.json({ success: true }, { status: 200 });
  }
);
