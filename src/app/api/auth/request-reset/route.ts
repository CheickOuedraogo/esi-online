// POST - Demande de réinitialisation de mot de passe (traitée par un admin, sans email).
// Entrée : RequestResetInput (contracts/auth). Sortie : 202 Accepted.
// Service : authService.requestReset. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { requestResetInputSchema } from "@/contracts/auth";
import { authService } from "@/server/services/auth.service";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = requestResetInputSchema.parse(body);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  await authService.requestReset(input, ip);

  return new Response(null, { status: 202 });
});
