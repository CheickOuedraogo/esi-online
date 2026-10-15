// GET - Renvoie l'utilisateur courant.
// Entrée : aucune. Sortie : UserPublic (contracts/auth).
// Service : requireAuth. Rôle : authentifié.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { requireAuth } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  const user = await requireAuth({ allowMustChangePassword: true });
  return Response.json(user, { status: 200 });
});
