// DELETE - Suppression définitive d'un compte utilisateur (204).
// Entrée : paramètre id. Sortie : 204 No Content.
// Service : usersService.deleteUser. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

export const DELETE = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    await usersService.deleteUser(admin.id, id);

    return new Response(null, { status: 204 });
  }
);
