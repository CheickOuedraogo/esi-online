// PATCH - Mise à jour d'un type de document.
// DELETE - Suppression d'un type de document (avec contrôle de conflits).
// Services : catalogService.updateDocumentType / catalogService.deleteDocumentType. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { createDocumentTypeSchema } from "@/contracts/catalog";
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
    const input = createDocumentTypeSchema.parse(body);

    const updated = await catalogService.updateDocumentType(id, input);
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

    await catalogService.deleteDocumentType(id);

    return Response.json({ success: true }, { status: 200 });
  }
);
