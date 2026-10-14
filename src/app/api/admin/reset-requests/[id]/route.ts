// PATCH /api/admin/reset-requests/:id : Traitement d'une demande de réinitialisation de mot de passe par l'admin.
// Entrée : { password?: string }. Sortie : AdminUser.
// Service : usersService.handleResetRequest. Rôle : admin.

import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

const patchResetRequestSchema = z.object({
  password: z.string().min(8).optional(),
});

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    let password: string | undefined;
    try {
      const body = await req.json();
      const parsed = patchResetRequestSchema.parse(body);
      password = parsed.password;
    } catch {
      // Pas de corps fourni, un mot de passe temporaire sera généré automatiquement
    }

    const updatedUser = await usersService.handleResetRequest(
      admin.id,
      id,
      password
    );

    return Response.json(updatedUser, { status: 200 });
  }
);
