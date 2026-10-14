// POST - Inscription d'un étudiant.
// Entrée : RegisterInput (contracts/auth). Sortie : UserPublic (contracts/auth).
// Service : authService.register. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { registerInputSchema } from "@/contracts/auth";
import { authService } from "@/server/services/auth.service";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = registerInputSchema.parse(body);
  const user = await authService.register(input);
  return Response.json(user, { status: 201 });
});
