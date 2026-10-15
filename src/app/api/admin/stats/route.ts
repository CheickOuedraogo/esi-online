// GET - Statistiques du tableau de bord d'administration :
// comptes en attente, propositions en attente, totaux et top des documents les plus téléchargés.
// Entrée : aucune. Sortie : AdminStats (contracts/admin).
// Service : statsService.getDashboardStats. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { statsService } from "@/server/services/stats.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const stats = await statsService.getDashboardStats();
  return Response.json(stats, { status: 200 });
});
