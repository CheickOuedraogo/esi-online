// Handlers MSW : reponses simulees conformes aux contrats (auth, catalogue,
// documents, propositions, administration) avec donnees statiques.

import { http, HttpResponse } from 'msw';
import {
  changePasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  requestResetInputSchema,
  type UserRole,
  type UserStatus,
} from '@/contracts/auth';
import type { CatalogResponse } from '@/contracts/catalog';
import { reviewProposalInputSchema, updateUserStatusInputSchema, adminContentInputSchema } from '@/contracts/admin';
import { createProposalInputSchema, updateProposalInputSchema } from '@/contracts/proposals';
import { buildMockPdf } from './pdf';
import {
  CATALOG,
  documents,
  getUserByEmail,
  getUserById,
  newId,
  proposals,
  readSession,
  resetRequests,
  toAdminUser,
  toDocumentItem,
  toProposalItem,
  toPublicUser,
  users,
  writeSession,
  type DbDocument,
  type MockUser,
} from './db';

const TEMP_PASSWORD = 'EsiTemp2026';

const subjectById = new Map(CATALOG.subjects.map((subject) => [subject.id, subject]));

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

function currentUser(): MockUser | undefined {
  return getUserById(readSession());
}

function requireValidatedStudent(): MockUser | Response {
  const user = currentUser();
  if (!user) return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
  if (user.role !== 'admin' && user.status !== 'validated') {
    if (user.status === 'pending') return errorResponse('ACCOUNT_PENDING', 'Compte en attente de validation.', 403);
    if (user.status === 'rejected') return errorResponse('ACCOUNT_REJECTED', 'Compte rejeté.', 403);
    return errorResponse('ACCOUNT_SUSPENDED', 'Compte suspendu.', 403);
  }
  return user;
}

function requireAdmin(): MockUser | Response {
  const user = currentUser();
  if (!user) return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
  if (user.role !== 'admin') return errorResponse('FORBIDDEN', "Accès réservé à l'administration.", 403);
  return user;
}

function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

function fileResponse(item: DbDocument, disposition: 'inline' | 'attachment') {
  const body = buildMockPdf(item.title, [
    item.originalFilename,
    item.academicYear ? `Annee academique : ${item.academicYear}` : '',
  ].filter(Boolean));
  return new HttpResponse(body, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `${disposition}; filename="${item.originalFilename}"`,
    },
  });
}

function filterDocuments(source: DbDocument[], url: URL) {
  const q = url.searchParams.get('q')?.trim().toLowerCase();
  const levelId = url.searchParams.get('levelId') ?? undefined;
  const programId = url.searchParams.get('programId') ?? undefined;
  const subjectId = url.searchParams.get('subjectId') ?? undefined;
  const typeId = url.searchParams.get('typeId') ?? undefined;
  const year = url.searchParams.get('year') ?? undefined;
  const sort = url.searchParams.get('sort') ?? 'recent';

  let items = source.filter((item) => {
    if (subjectId && item.subjectId !== subjectId) return false;
    if (typeId && item.typeId !== typeId) return false;
    if (year && item.academicYear !== year) return false;
    const subject = subjectById.get(item.subjectId);
    if (levelId && subject?.levelId !== levelId) return false;
    if (programId && subject?.programId !== programId) return false;
    if (q) {
      const haystack = `${item.title} ${item.description ?? ''} ${subject?.name ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (sort === 'popular') items = [...items].sort((a, b) => b.downloadCount - a.downloadCount);
  else if (sort === 'title') items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  else items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? '12') || 12);
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize).map(toDocumentItem),
    page,
    pageSize,
    total,
  };
}

function temporaryPasswordResponse(user: MockUser) {
  user.password = TEMP_PASSWORD;
  user.mustChangePassword = true;
  return HttpResponse.json({ id: user.id, temporaryPassword: TEMP_PASSWORD });
}

export const handlers = [
  http.get('/api/catalog', () => HttpResponse.json(CATALOG as CatalogResponse)),

  http.post('/api/auth/register', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = registerInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    if (getUserByEmail(parsed.data.email)) {
      return errorResponse('CONFLICT', 'Cet e-mail est déjà utilisé.', 409);
    }
    const user: MockUser = {
      id: newId(),
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
      role: 'student' as UserRole,
      status: 'pending' as UserStatus,
      mustChangePassword: false,
      programId: parsed.data.programId,
      levelId: parsed.data.levelId,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return HttpResponse.json(toPublicUser(user), { status: 201 });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = loginInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const user = getUserByEmail(parsed.data.email);
    if (!user || user.password !== parsed.data.password) {
      return errorResponse('UNAUTHENTICATED', 'E-mail ou mot de passe incorrect.', 401);
    }
    if (user.status === 'suspended') {
      return errorResponse('ACCOUNT_SUSPENDED', 'Ce compte est suspendu.', 403);
    }
    writeSession(user.id);
    return HttpResponse.json({
      id: user.id,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    });
  }),

  http.post('/api/auth/logout', () => {
    writeSession(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/auth/me', () => {
    const user = currentUser();
    if (!user) return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
    return HttpResponse.json(toPublicUser(user));
  }),

  http.post('/api/auth/request-reset', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = requestResetInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const user = getUserByEmail(parsed.data.email);
    if (user && !resetRequests.some((r) => r.userId === user.id && r.status === 'pending')) {
      resetRequests.unshift({
        id: newId(),
        userId: user.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    return new HttpResponse(null, { status: 202 });
  }),

  http.post('/api/auth/change-password', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = changePasswordInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const user = currentUser();
    if (!user) return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
    user.password = parsed.data.newPassword;
    user.mustChangePassword = false;
    return new HttpResponse(null, { status: 200 });
  }),

  http.get('/api/public/documents', ({ request }) => {
    const url = new URL(request.url);
    const source = documents.filter((item) => item.visibility === 'public');
    return HttpResponse.json(filterDocuments(source, url));
  }),

  http.get('/api/public/documents/:id', ({ params }) => {
    const item = documents.find((candidate) => candidate.id === params.id && candidate.visibility === 'public');
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    return HttpResponse.json(toDocumentItem(item));
  }),

  http.get('/api/documents', ({ request }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const url = new URL(request.url);
    return HttpResponse.json(filterDocuments(documents, url));
  }),

  http.get('/api/documents/:id', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const item = documents.find((candidate) => candidate.id === params.id);
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    return HttpResponse.json(toDocumentItem(item));
  }),

  http.get('/api/documents/:id/download', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const item = documents.find((candidate) => candidate.id === params.id);
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    item.downloadCount += 1;
    return fileResponse(item, 'attachment');
  }),

  http.get('/api/documents/:id/file', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const item = documents.find((candidate) => candidate.id === params.id);
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    return fileResponse(item, 'inline');
  }),

  http.get('/api/public/documents/:id/file', ({ params }) => {
    const item = documents.find((candidate) => candidate.id === params.id && candidate.visibility === 'public');
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    return fileResponse(item, 'inline');
  }),

  http.get('/api/me/proposals', () => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const mine = proposals
      .filter((item) => item.uploadedBy === auth.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toProposalItem);
    return HttpResponse.json(mine);
  }),

  http.post('/api/proposals', async ({ request }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const payload = await request.json().catch(() => null);
    const parsed = createProposalInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const proposal: DbDocument = {
      id: newId(),
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      subjectId: parsed.data.subjectId,
      typeId: parsed.data.typeId,
      academicYear: parsed.data.academicYear ?? null,
      visibility: 'students',
      status: 'pending',
      originalFilename: parsed.data.originalFilename,
      mimeType: 'application/pdf',
      sizeBytes: 640 * 1024,
      uploadedBy: auth.id,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      rejectionReason: null,
    };
    proposals.unshift(proposal);
    return HttpResponse.json(toProposalItem(proposal), { status: 201 });
  }),

  http.delete('/api/proposals/:id', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const index = proposals.findIndex((item) => item.id === params.id && item.uploadedBy === auth.id);
    if (index === -1) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    if (proposals[index].status === 'approved') {
      return errorResponse('CONFLICT', 'Une proposition approuvée ne peut plus être supprimée.', 409);
    }
    proposals.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/proposals/:id', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const proposal = proposals.find((item) => item.id === params.id && item.uploadedBy === auth.id);
    if (!proposal) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    return HttpResponse.json(toProposalItem(proposal));
  }),

  http.get('/api/proposals/:id/file', ({ params }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const proposal = proposals.find((item) => item.id === params.id && item.uploadedBy === auth.id);
    if (!proposal) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    if (!toProposalItem(proposal).contentAvailable) {
      return errorResponse(
        'NOT_FOUND',
        'Le fichier a été supprimé après 3 jours pour économiser le stockage.',
        404,
      );
    }
    return fileResponse(proposal, 'inline');
  }),

  http.patch('/api/proposals/:id', async ({ params, request }) => {
    const auth = requireValidatedStudent();
    if (isResponse(auth)) return auth;
    const proposal = proposals.find((item) => item.id === params.id && item.uploadedBy === auth.id);
    if (!proposal) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    if (proposal.status === 'approved') {
      return errorResponse('CONFLICT', 'Une proposition approuvée ne peut plus être modifiée.', 409);
    }
    const payload = await request.json().catch(() => null);
    const parsed = updateProposalInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    proposal.title = parsed.data.title;
    proposal.description = parsed.data.description ?? null;
    proposal.subjectId = parsed.data.subjectId;
    proposal.typeId = parsed.data.typeId;
    proposal.academicYear = parsed.data.academicYear ?? null;
    proposal.originalFilename = parsed.data.originalFilename;
    proposal.status = 'pending';
    proposal.rejectionReason = null;
    proposal.createdAt = new Date().toISOString();
    proposal.publishedAt = null;
    return HttpResponse.json(toProposalItem(proposal));
  }),

  http.get('/api/admin/stats', () => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    return HttpResponse.json({
      pendingUsers: users.filter((user) => user.status === 'pending').length,
      pendingProposals: proposals.filter((item) => item.status === 'pending').length,
      pendingResetRequests: resetRequests.filter((item) => item.status === 'pending').length,
      totalDocuments: documents.length,
      totalUsers: users.length,
      totalDownloads: documents.reduce((sum, item) => sum + item.downloadCount, 0),
      topDocuments: [...documents]
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5)
        .map((item) => ({ id: item.id, title: item.title, downloadCount: item.downloadCount })),
    });
  }),

  http.get('/api/admin/users', ({ request }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase();
    const status = url.searchParams.get('status') ?? undefined;
    const role = url.searchParams.get('role') ?? undefined;
    const items = users
      .filter((user) => {
        if (status && user.status !== status) return false;
        if (role && user.role !== role) return false;
        if (q && !`${user.fullName} ${user.email}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toAdminUser);
    return HttpResponse.json(items);
  }),

  http.patch('/api/admin/users/:id/status', async ({ params, request }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const payload = await request.json().catch(() => null);
    const parsed = updateUserStatusInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const user = users.find((candidate) => candidate.id === params.id);
    if (!user) return errorResponse('NOT_FOUND', 'Utilisateur introuvable.', 404);
    user.status = parsed.data.status;
    return HttpResponse.json(toAdminUser(user));
  }),

  http.post('/api/admin/users/:id/reset-password', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const user = users.find((candidate) => candidate.id === params.id);
    if (!user) return errorResponse('NOT_FOUND', 'Utilisateur introuvable.', 404);
    return temporaryPasswordResponse(user);
  }),

  http.delete('/api/admin/users/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    if (params.id === auth.id) {
      return errorResponse('CONFLICT', 'Vous ne pouvez pas supprimer votre propre compte.', 409);
    }
    const index = users.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return errorResponse('NOT_FOUND', 'Utilisateur introuvable.', 404);
    users.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/documents', ({ request }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const url = new URL(request.url);
    return HttpResponse.json(filterDocuments(documents, url));
  }),

  http.get('/api/admin/documents/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const item = documents.find((candidate) => candidate.id === params.id);
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    return HttpResponse.json(toDocumentItem(item));
  }),

  http.patch('/api/admin/documents/:id', async ({ params, request }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const item = documents.find((candidate) => candidate.id === params.id);
    if (!item) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    const payload = await request.json().catch(() => null);
    const parsed = adminContentInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    item.title = parsed.data.title;
    item.description = parsed.data.description ?? null;
    item.subjectId = parsed.data.subjectId;
    item.typeId = parsed.data.typeId;
    item.academicYear = parsed.data.academicYear ?? null;
    item.visibility = parsed.data.visibility;
    return HttpResponse.json(toDocumentItem(item));
  }),

  http.delete('/api/admin/documents/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const index = documents.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return errorResponse('NOT_FOUND', 'Document introuvable.', 404);
    documents.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/proposals', () => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const items = [...proposals]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toProposalItem);
    return HttpResponse.json(items);
  }),

  http.get('/api/admin/proposals/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const proposal = proposals.find((candidate) => candidate.id === params.id);
    if (!proposal) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    return HttpResponse.json(toProposalItem(proposal));
  }),

  http.get('/api/admin/proposals/:id/file', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const proposal = proposals.find((candidate) => candidate.id === params.id);
    if (!proposal) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    if (!toProposalItem(proposal).contentAvailable) {
      return errorResponse(
        'NOT_FOUND',
        'Le fichier a été supprimé après 3 jours pour économiser le stockage.',
        404,
      );
    }
    return fileResponse(proposal, 'inline');
  }),

  http.patch('/api/admin/proposals/:id', async ({ params, request }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const index = proposals.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    const proposal = proposals[index];
    const payload = await request.json().catch(() => null);

    const review = reviewProposalInputSchema.safeParse(payload);
    if (review.success) {
      if (review.data.action === 'approve') {
        proposal.status = 'approved';
        proposal.visibility = review.data.visibility ?? 'students';
        proposal.publishedAt = new Date().toISOString();
        proposal.rejectionReason = null;
        documents.unshift(proposal);
        proposals.splice(index, 1);
        return HttpResponse.json(toDocumentItem(proposal));
      }
      proposal.status = 'rejected';
      proposal.rejectionReason = review.data.reason ?? 'Proposition refusée par l’administration.';
      return HttpResponse.json(toProposalItem(proposal));
    }

    const edit = adminContentInputSchema.safeParse(payload);
    if (!edit.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, edit.error.flatten());
    }
    proposal.title = edit.data.title;
    proposal.description = edit.data.description ?? null;
    proposal.subjectId = edit.data.subjectId;
    proposal.typeId = edit.data.typeId;
    proposal.academicYear = edit.data.academicYear ?? null;
    proposal.visibility = edit.data.visibility;
    return HttpResponse.json(toProposalItem(proposal));
  }),

  http.delete('/api/admin/proposals/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const index = proposals.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return errorResponse('NOT_FOUND', 'Proposition introuvable.', 404);
    proposals.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/reset-requests', () => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const items = resetRequests
      .map((item) => {
        const user = getUserById(item.userId);
        return {
          id: item.id,
          userId: item.userId,
          fullName: user?.fullName ?? 'Utilisateur supprimé',
          email: user?.email ?? '—',
          status: item.status,
          createdAt: item.createdAt,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(items);
  }),

  http.patch('/api/admin/reset-requests/:id', ({ params }) => {
    const auth = requireAdmin();
    if (isResponse(auth)) return auth;
    const request = resetRequests.find((candidate) => candidate.id === params.id);
    if (!request) return errorResponse('NOT_FOUND', 'Demande introuvable.', 404);
    const user = getUserById(request.userId);
    if (!user) return errorResponse('NOT_FOUND', 'Utilisateur introuvable.', 404);
    request.status = 'done';
    const response = temporaryPasswordResponse(user);
    return response;
  }),
];
