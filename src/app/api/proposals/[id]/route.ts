// GET, PATCH, DELETE sur /api/proposals/:id
// Rôle : étudiant propriétaire (ou admin).

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { createProposalSchema } from "@/contracts/proposals";
import { proposalsService } from "@/server/services/proposals.service";
import { requireValidatedStudent } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireValidatedStudent();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const proposal = await proposalsService.getProposal(
      id,
      user.id,
      user.role === "admin"
    );
    return Response.json(proposal, { status: 200 });
  }
);

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireValidatedStudent();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      const rawMeta = {
        title: formData.get("title") || undefined,
        description: formData.get("description") !== null ? formData.get("description") : undefined,
        subjectId: formData.get("subjectId") || undefined,
        typeId: formData.get("typeId") || undefined,
        academicYear: formData.get("academicYear") || undefined,
      };

      const meta = createProposalSchema.partial().parse(rawMeta);

      let newFile:
        | {
            stream: Readable;
            filename: string;
            sizeBytes: number;
            headerBuffer: Buffer;
          }
        | undefined;

      if (file && typeof file !== "string" && file instanceof Blob) {
        const headerBuffer = Buffer.from(await file.slice(0, 512).arrayBuffer());
        const stream = Readable.fromWeb(file.stream() as any);
        newFile = {
          stream,
          filename: file.name,
          sizeBytes: file.size,
          headerBuffer,
        };
      }

      const updated = await proposalsService.updateProposal(
        id,
        user.id,
        meta,
        newFile
      );
      return Response.json(updated, { status: 200 });
    } else {
      const body = await req.json();
      const meta = createProposalSchema.partial().parse(body);
      const updated = await proposalsService.updateProposal(id, user.id, meta);
      return Response.json(updated, { status: 200 });
    }
  }
);

export const DELETE = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireValidatedStudent();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    await proposalsService.cancelProposal(user.id, id);

    return new Response(null, { status: 204 });
  }
);
