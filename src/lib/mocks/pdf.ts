// Generateur de PDF minimal et valide pour les documents de demonstration.
// Permet d'afficher un vrai aperçu dans la visionneuse sans fichier reel.

function toAscii(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

function escapeText(input: string): string {
  return toAscii(input).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildMockPdf(title: string, lines: string[] = []): string {
  const content: string[] = [
    `BT /F1 20 Tf 72 742 Td (${escapeText(title)}) Tj ET`,
    'BT /F1 11 Tf 72 720 Td (ESI-Library - document de demonstration) Tj ET',
  ];

  let y = 682;
  for (const line of lines) {
    if (y < 72) break;
    content.push(`BT /F1 12 Tf 72 ${y} Td (${escapeText(line)}) Tj ET`);
    y -= 22;
  }

  const stream = content.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}
