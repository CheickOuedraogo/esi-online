// POST - Changement de mot de passe (obligatoire après un mot de passe temporaire).
// Entrée : ChangePasswordInput (contracts/auth). Sortie : 204 No Content.
// Service : authService.changePassword. Rôle : authentifié.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { changePasswordInputSchema } from "@/contracts/auth";
import { authService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/auth/guards";

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuth({ allowMustChangePassword: true });
  const body = await req.json();
  const input = changePasswordInputSchema.parse(body);

  await authService.changePassword(user.id, input);

  return new Response(null, { status: 204 });
});
