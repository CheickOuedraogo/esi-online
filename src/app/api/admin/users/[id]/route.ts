// GET - Détail d'un compte utilisateur (vue admin).
// PATCH - Modification des informations d'un compte (nom, email, rôle, niveau).
// DELETE - Suppression définitive d'un compte utilisateur (204).
// Services : usersService.getAdminUser / updateUser / deleteUser. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { updateUserInputSchema } from "@/contracts/admin";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const user = await usersService.getAdminUser(id);

    return Response.json(user, { status: 200 });
  }
);

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const body = await req.json();
    const input = updateUserInputSchema.parse(body);

    const updatedUser = await usersService.updateUser(admin.id, id, input);

    return Response.json(updatedUser, { status: 200 });
  }
);

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
