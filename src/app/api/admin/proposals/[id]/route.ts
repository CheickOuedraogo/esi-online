// GET, PATCH, DELETE sur /api/admin/proposals/:id
// Rôle : admin.

import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { moderateProposalSchema } from "@/contracts/proposals";
import { proposalsService } from "@/server/services/proposals.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const proposal = await proposalsService.getProposal(id, undefined, true);
    return Response.json(proposal, { status: 200 });
  }
);

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const body = await req.json();
    const input = moderateProposalSchema.parse(body);

    const proposal = await proposalsService.moderateProposal(
      admin.id,
      id,
      input
    );

    return Response.json(proposal, { status: 200 });
  }
);

export const DELETE = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    await proposalsService.cancelProposal(admin.id, id, true);

    return new Response(null, { status: 204 });
  }
);
