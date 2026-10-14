// POST - Connexion d'un utilisateur.
// Entrée : LoginInput (contracts/auth). Sortie : { id, role, status, mustChangePassword, user } ; session posée via cookie httpOnly.
// Service : authService.login. Rôle : public.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { loginInputSchema } from "@/contracts/auth";
import { authService } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/auth/session";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = loginInputSchema.parse(body);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent");

  const { user, token, expiresAt } = await authService.login(
    input,
    ip,
    userAgent
  );

  const headers = new Headers();
  setSessionCookie(headers, token, expiresAt);

  // Fournit à la fois les champs à la racine ({ id, role, status, mustChangePassword })
  // et l'objet complet { user } pour compatibilité totale avec le client front.
  return Response.json(
    {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      user,
    },
    { status: 200, headers }
  );
});
