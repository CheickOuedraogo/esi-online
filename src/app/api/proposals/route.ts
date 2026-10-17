// POST - Création d'une proposition par un étudiant (fichier + métadonnées en multipart/form-data).
// Entrée : multipart/form-data (file, title, description, subject, typeId, levelId, academicYear).
// Sortie : Proposal (contracts/proposals).
// Service : proposalsService.createProposal. Rôle : étudiant validé (ou admin).

import { Readable } from "stream";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/utils/api-handler";
import { createProposalSchema } from "@/contracts/proposals";
import { proposalsService } from "@/server/services/proposals.service";
import { requireValidatedStudent } from "@/server/auth/guards";
import { ValidationError } from "@/server/errors/http-errors";

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireValidatedStudent();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || !(file instanceof Blob)) {
    throw new ValidationError("Le fichier est requis");
  }

  const rawMeta = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    subject: formData.get("subject"),
    typeId: formData.get("typeId"),
    levelId: formData.get("levelId") || undefined,
    academicYear: formData.get("academicYear") || undefined,
  };

  const meta = createProposalSchema.parse(rawMeta);

  // Validation par signature sur l'en-tête (512 octets) et streaming direct du flux (pas de 50 Mo en RAM)
  const headerBuffer = Buffer.from(await file.slice(0, 512).arrayBuffer());
  const stream = Readable.fromWeb(file.stream() as any);

  const proposal = await proposalsService.createProposal(
    user.id,
    {
      stream,
      filename: file.name,
      sizeBytes: file.size,
      headerBuffer,
    },
    file.name,
    meta
  );

  return Response.json(proposal, { status: 201 });
});
