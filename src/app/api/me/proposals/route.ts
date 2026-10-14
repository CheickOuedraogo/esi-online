// GET - Liste des propositions de l'utilisateur courant.
// Entrée : aucune. Sortie : Proposal[] (contracts/proposals).
// Service : proposalsService.listMyProposals. Rôle : étudiant validé (ou admin).

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { proposalsService } from "@/server/services/proposals.service";
import { requireValidatedStudent } from "@/server/auth/guards";

export const GET = apiHandler(async (_req: NextRequest) => {
  const user = await requireValidatedStudent();
  const proposals = await proposalsService.listMyProposals(user.id);
  return Response.json(proposals, { status: 200 });
});
