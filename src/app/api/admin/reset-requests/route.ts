// GET - Liste des demandes de réinitialisation de mot de passe en attente.
// Entrée : aucune. Sortie : PasswordResetRequestItem[] (contracts/admin).
// Service : usersService.listResetRequests. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const requests = await usersService.listResetRequests();
  return Response.json(requests, { status: 200 });
});
