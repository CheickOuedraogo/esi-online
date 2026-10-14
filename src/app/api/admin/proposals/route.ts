// GET - Liste des propositions à modérer pour les administrateurs.
// Entrée : proposalFiltersSchema (contracts/proposals). Sortie : PaginatedResponse<Proposal>.
// Service : proposalsService.listAdminProposals. Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { proposalFiltersSchema } from "@/contracts/proposals";
import { proposalsService } from "@/server/services/proposals.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const filters = proposalFiltersSchema.parse(rawParams);

  const result = await proposalsService.listAdminProposals(filters);
  return Response.json(result, { status: 200 });
});
