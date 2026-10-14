// POST - Déconnexion : détruit la session en base et efface le cookie.
// Entrée : aucune. Sortie : 204 No Content.
// Service : authService.logout. Rôle : authentifié.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { authService } from "@/server/services/auth.service";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
} from "@/server/auth/session";

export const POST = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await authService.logout(token);
  }

  const headers = new Headers();
  clearSessionCookie(headers);

  return new Response(null, { status: 204, headers });
});
