// GET - Liste admin des documents (tous statuts et visibilités).
// POST - Dépôt direct d'un document par un administrateur (fichier + métadonnées en multipart/form-data).
// Services : documentsService.listAdmin / documentsService.createAdmin. Rôle : admin.

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import {
  adminDocumentFiltersSchema,
  createDocumentSchema,
} from "@/contracts/documents";
import { documentsService } from "@/server/services/documents.service";
import { requireAdmin } from "@/server/auth/guards";
import { ValidationError } from "@/server/errors/http-errors";

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const filters = adminDocumentFiltersSchema.parse(rawParams);

  const result = await documentsService.listAdmin(filters);
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || !(file instanceof Blob)) {
    throw new ValidationError("Le fichier est requis");
  }

  const rawMeta = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    subjectId: formData.get("subjectId"),
    typeId: formData.get("typeId"),
    academicYear: formData.get("academicYear") || undefined,
    visibility: formData.get("visibility") || "students",
  };

  const meta = createDocumentSchema.parse(rawMeta);

  // Validation par signature sur l'en-tête (512 octets) et streaming direct du corps (zéro saturation mémoire)
  const headerBuffer = Buffer.from(await file.slice(0, 512).arrayBuffer());
  const stream = Readable.fromWeb(file.stream() as any);

  const document = await documentsService.createAdmin(
    admin.id,
    {
      stream,
      filename: file.name,
      sizeBytes: file.size,
      headerBuffer,
    },
    file.name,
    meta
  );

  return Response.json(document, { status: 201 });
});
