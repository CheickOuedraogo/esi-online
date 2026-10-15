// GET - Détail complet d'un document.
// PATCH - Édition d'un document (métadonnées et remplacement optionnel du fichier).
// DELETE - Suppression définitive d'un document (base de données et fichier physique, 204).
// Services : documentsService.getDetail / documentsService.updateAdmin / documentsService.deleteAdmin. Rôle : admin.

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { uuidParamSchema } from "@/contracts/common";
import { updateDocumentSchema } from "@/contracts/documents";
import { documentsService } from "@/server/services/documents.service";
import { requireAdmin } from "@/server/auth/guards";

export const GET = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    const doc = await documentsService.getDetail(id, admin);
    return Response.json(doc, { status: 200 });
  }
);

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
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
        visibility: formData.get("visibility") || undefined,
      };

      const meta = updateDocumentSchema.parse(rawMeta);

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

      const updated = await documentsService.updateAdmin(id, meta, newFile);
      return Response.json(updated, { status: 200 });
    } else {
      const body = await req.json();
      const meta = updateDocumentSchema.parse(body);
      const updated = await documentsService.updateAdmin(id, meta);
      return Response.json(updated, { status: 200 });
    }
  }
);

export const DELETE = apiHandler(
  async (
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin();
    const params = await context.params;
    const { id } = uuidParamSchema.parse(params);

    await documentsService.deleteAdmin(id);

    return new Response(null, { status: 204 });
  }
);
