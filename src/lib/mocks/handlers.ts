// Handlers MSW : reponses simulees conformes aux contrats (auth, catalogue).

import { http, HttpResponse } from 'msw';
import {
  changePasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  requestResetInputSchema,
  type AuthUser,
  type UserRole,
  type UserStatus,
} from '@/contracts/auth';
import type { CatalogResponse } from '@/contracts/catalog';

interface MockUser extends AuthUser {
  password: string;
}

const SEED_USERS: MockUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'Awa Traore',
    email: 'etudiant@esi.bf',
    password: 'password123',
    role: 'student',
    status: 'validated',
    mustChangePassword: false,
    programId: '22222222-2222-4222-8222-222222222222',
    levelId: '33333333-3333-4333-8333-333333333333',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    fullName: 'Ibrahim Kone',
    email: 'enattente@esi.bf',
    password: 'password123',
    role: 'student',
    status: 'pending',
    mustChangePassword: false,
    programId: '55555555-5555-4555-8555-555555555555',
    levelId: '33333333-3333-4333-8333-333333333333',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    fullName: 'Admin ESI',
    email: 'admin@esi.bf',
    password: 'admin1234',
    role: 'admin',
    status: 'validated',
    mustChangePassword: false,
    programId: null,
    levelId: null,
    createdAt: '2026-08-01T08:00:00.000Z',
  },
];

const users: MockUser[] = [...SEED_USERS];
let currentUserId: string | null = null;

const CATALOG: CatalogResponse = {
  levels: [
    { id: '33333333-3333-4333-8333-333333333333', name: 'Licence 1' },
    { id: '33333333-3333-4333-8333-333333333334', name: 'Licence 2' },
    { id: '33333333-3333-4333-8333-333333333335', name: 'Licence 3' },
    { id: '33333333-3333-4333-8333-333333333336', name: 'Master 1' },
    { id: '33333333-3333-4333-8333-333333333337', name: 'Master 2' },
  ],
  programs: [
    { id: '22222222-2222-4222-8222-222222222222', name: 'Génie logiciel' },
    { id: '55555555-5555-4555-8555-555555555555', name: 'Réseaux et télécommunications' },
    { id: '77777777-7777-4777-8777-777777777777', name: 'Systèmes d’information' },
    { id: '88888888-8888-4888-8888-888888888888', name: 'Cybersécurité' },
  ],
  subjects: [
    {
      id: '99999999-9999-4999-8999-999999999991',
      name: 'Algorithmique',
      levelId: '33333333-3333-4333-8333-333333333333',
      programId: '22222222-2222-4222-8222-222222222222',
    },
    {
      id: '99999999-9999-4999-8999-999999999992',
      name: 'Bases de données',
      levelId: '33333333-3333-4333-8333-333333333334',
      programId: '22222222-2222-4222-8222-222222222222',
    },
  ],
  documentTypes: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'cours' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'TD' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'TP' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', name: 'examen' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', name: 'corrigé' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', name: 'mémoire' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', name: 'autre' },
  ],
};

function toPublicUser({ password: _password, ...rest }: MockUser): AuthUser {
  void _password;
  return rest;
}

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

function findUserByEmail(email: string): MockUser | undefined {
  return users.find((user) => user.email === email);
}

export const handlers = [
  http.get('/api/catalog', () => HttpResponse.json(CATALOG)),

  http.post('/api/auth/register', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = registerInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    if (findUserByEmail(parsed.data.email)) {
      return errorResponse('CONFLICT', 'Cet e-mail est déjà utilisé.', 409);
    }
    const user: MockUser = {
      id: crypto.randomUUID(),
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
    const user = findUserByEmail(parsed.data.email);
    if (!user || user.password !== parsed.data.password) {
      return errorResponse('UNAUTHENTICATED', 'E-mail ou mot de passe incorrect.', 401);
    }
    if (user.status === 'suspended') {
      return errorResponse('ACCOUNT_SUSPENDED', 'Ce compte est suspendu.', 403);
    }
    currentUserId = user.id;
    return HttpResponse.json({
      id: user.id,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    });
  }),

  http.post('/api/auth/logout', () => {
    currentUserId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/auth/me', () => {
    const user = users.find((candidate) => candidate.id === currentUserId);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
    }
    return HttpResponse.json(toPublicUser(user));
  }),

  http.post('/api/auth/request-reset', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = requestResetInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    return new HttpResponse(null, { status: 202 });
  }),

  http.post('/api/auth/change-password', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    const parsed = changePasswordInputSchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Entrée invalide.', 400, parsed.error.flatten());
    }
    const user = users.find((candidate) => candidate.id === currentUserId);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Session absente ou expirée.', 401);
    }
    user.password = parsed.data.newPassword;
    user.mustChangePassword = false;
    return new HttpResponse(null, { status: 200 });
  }),
];
