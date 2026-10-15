// POST - Génère un mot de passe temporaire pour un utilisateur.
// Entrée : paramètre id. Sortie : ResetPasswordResponse (contracts/admin).
// Service : usersService.resetPassword. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

export const POST = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const result = await usersService.resetPassword(admin.id, id);

    return Response.json(result, { status: 200 });
  }
);
