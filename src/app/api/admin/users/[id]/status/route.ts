// PATCH - Validation, refus (avec motif) ou suspension d'un compte utilisateur.
// Entrée : updateUserStatusSchema (contracts/admin). Sortie : UserPublic.
// Service : usersService.updateUserStatus. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { updateUserStatusSchema } from "@/contracts/admin";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const body = await req.json();
    const input = updateUserStatusSchema.parse(body);

    const updatedUser = await usersService.updateUserStatus(
      admin.id,
      id,
      input
    );

    return Response.json(updatedUser, { status: 200 });
  }
);
