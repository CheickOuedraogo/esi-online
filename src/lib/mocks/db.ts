// Base de donnees statique et fictive utilisee par les mocks MSW.
// Contient les utilisateurs, le catalogue, les documents, les propositions
// et les demandes de reinitialisation, ainsi que la session simulee.

import type { AuthUser, UserRole, UserStatus } from '@/contracts/auth';
import type { CatalogResponse } from '@/contracts/catalog';
import type { AdminUser } from '@/contracts/admin';
import type { DocumentItem, DocumentStatus, Visibility } from '@/contracts/documents';
import { PROPOSAL_RETENTION_DAYS } from '@/contracts/proposals';

export interface MockUser extends AuthUser {
  password: string;
}

export interface DbDocument {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  typeId: string;
  academicYear: string | null;
  visibility: Visibility;
  status: DocumentStatus;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  downloadCount: number;
  createdAt: string;
  publishedAt: string | null;
  rejectionReason: string | null;
}

export interface DbResetRequest {
  id: string;
  userId: string;
  status: 'pending' | 'done';
  createdAt: string;
}

export const SESSION_KEY = 'esi-library:mock-session';

export const CATALOG: CatalogResponse = {
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
    { id: '99999999-9999-4999-8999-999999999991', name: 'Algorithmique', levelId: '33333333-3333-4333-8333-333333333333', programId: '22222222-2222-4222-8222-222222222222' },
    { id: '99999999-9999-4999-8999-999999999992', name: 'Bases de données', levelId: '33333333-3333-4333-8333-333333333334', programId: '22222222-2222-4222-8222-222222222222' },
    { id: '99999999-9999-4999-8999-999999999993', name: 'Programmation web', levelId: '33333333-3333-4333-8333-333333333335', programId: '22222222-2222-4222-8222-222222222222' },
    { id: '99999999-9999-4999-8999-999999999994', name: 'Réseaux informatiques', levelId: '33333333-3333-4333-8333-333333333334', programId: '55555555-5555-4555-8555-555555555555' },
    { id: '99999999-9999-4999-8999-999999999995', name: 'Télécommunications', levelId: '33333333-3333-4333-8333-333333333335', programId: '55555555-5555-4555-8555-555555555555' },
    { id: '99999999-9999-4999-8999-999999999996', name: 'Systèmes d’information', levelId: '33333333-3333-4333-8333-333333333335', programId: '77777777-7777-4777-8777-777777777777' },
    { id: '99999999-9999-4999-8999-999999999997', name: 'Cybersécurité', levelId: '33333333-3333-4333-8333-333333333336', programId: '88888888-8888-4888-8888-888888888888' },
    { id: '99999999-9999-4999-8999-999999999998', name: 'Mathématiques discrètes', levelId: '33333333-3333-4333-8333-333333333333', programId: '22222222-2222-4222-8222-222222222222' },
    { id: '99999999-9999-4999-8999-999999999999', name: 'Génie logiciel', levelId: '33333333-3333-4333-8333-333333333335', programId: '22222222-2222-4222-8222-222222222222' },
    { id: '99999999-9999-4999-8999-999999999990', name: 'Cryptographie', levelId: '33333333-3333-4333-8333-333333333336', programId: '88888888-8888-4888-8888-888888888888' },
  ],
  documentTypes: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'Cours' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'TD' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'TP' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', name: 'Examen' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', name: 'Corrigé' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', name: 'Mémoire' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', name: 'Autre' },
  ],
};

const PASSWORD = 'password123';

export const users: MockUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'Awa Traoré',
    email: 'etudiant@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'validated',
    mustChangePassword: false,
    programId: '22222222-2222-4222-8222-222222222222',
    levelId: '33333333-3333-4333-8333-333333333335',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    fullName: 'Ibrahim Koné',
    email: 'enattente@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'pending',
    mustChangePassword: false,
    programId: '55555555-5555-4555-8555-555555555555',
    levelId: '33333333-3333-4333-8333-333333333334',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    fullName: 'Administrateur ESI',
    email: 'admin@esi.bf',
    password: 'admin1234',
    role: 'admin',
    status: 'validated',
    mustChangePassword: false,
    programId: null,
    levelId: null,
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: '12121212-1212-4212-8212-121212121212',
    fullName: 'Fatou Diallo',
    email: 'fatou@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'validated',
    mustChangePassword: false,
    programId: '77777777-7777-4777-8777-777777777777',
    levelId: '33333333-3333-4333-8333-333333333336',
    createdAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: '13131313-1313-4313-8313-131313131313',
    fullName: 'Moussa Ouédraogo',
    email: 'moussa@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'pending',
    mustChangePassword: false,
    programId: '88888888-8888-4888-8888-888888888888',
    levelId: '33333333-3333-4333-8333-333333333333',
    createdAt: '2026-10-08T08:00:00.000Z',
  },
  {
    id: '14141414-1414-4414-8414-141414141414',
    fullName: 'Salif Bancé',
    email: 'salif@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'validated',
    mustChangePassword: false,
    programId: '22222222-2222-4222-8222-222222222222',
    levelId: '33333333-3333-4333-8333-333333333333',
    createdAt: '2026-09-05T08:00:00.000Z',
  },
  {
    id: '15151515-1515-4515-8515-151515151515',
    fullName: 'Nadège Sana',
    email: 'nadege@esi.bf',
    password: PASSWORD,
    role: 'student',
    status: 'suspended',
    mustChangePassword: false,
    programId: '77777777-7777-4777-8777-777777777777',
    levelId: '33333333-3333-4333-8333-333333333334',
    createdAt: '2026-09-12T08:00:00.000Z',
  },
];

function doc(
  id: string,
  title: string,
  description: string,
  subjectId: string,
  typeId: string,
  year: string,
  visibility: Visibility,
  sizeKb: number,
  uploadedBy: string | null,
  downloadCount: number,
  createdAt: string,
): DbDocument {
  return {
    id,
    title,
    description,
    subjectId,
    typeId,
    academicYear: year,
    visibility,
    status: 'approved',
    originalFilename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: sizeKb * 1024,
    uploadedBy,
    downloadCount,
    createdAt,
    publishedAt: createdAt,
    rejectionReason: null,
  };
}

const ADMIN_ID = '66666666-6666-4666-8666-666666666666';
const AWA = '11111111-1111-4111-8111-111111111111';
const FATOU = '12121212-1212-4212-8212-121212121212';
const SALIF = '14141414-1414-4414-8414-141414141414';

export const documents: DbDocument[] = [
  doc('b0000000-0000-4000-8000-000000000001', 'Algorithmique — Cours complet', 'Cours d’algorithmique : structures de données, complexité, tri et recherche.', '99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2025-2026', 'students', 2480, ADMIN_ID, 128, '2026-09-02T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000002', 'Algorithmique — Corrigés des TD', 'Correction détaillée des travaux dirigés de la matière.', '99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '2025-2026', 'students', 1120, ADMIN_ID, 96, '2026-09-03T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000003', 'Bases de données — Cours', 'Modèle relationnel, algèbre relationnelle, SQL et normalisation.', '99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2025-2026', 'students', 3260, ADMIN_ID, 154, '2026-09-04T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000004', 'Bases de données — TP MySQL', 'Énoncés des travaux pratiques sous MySQL Workbench.', '99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '2025-2026', 'students', 890, ADMIN_ID, 87, '2026-09-05T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000005', 'Programmation web — Cours HTML/CSS/JS', 'Fondamentaux du développement web côté client.', '99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2024-2025', 'public', 1980, ADMIN_ID, 201, '2026-08-15T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000006', 'Programmation web — Examen 2025', 'Sujet d’examen de programmation web, session 2025.', '99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '2024-2025', 'students', 540, ADMIN_ID, 143, '2026-08-20T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000007', 'Réseaux informatiques — TD', 'Travaux dirigés : adressage IP, sous-réseaux, protocoles.', '99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '2025-2026', 'public', 760, ADMIN_ID, 64, '2026-09-06T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000008', 'Réseaux informatiques — Examen 2024', 'Sujet d’examen de réseaux, session 2024.', '99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '2023-2024', 'public', 620, ADMIN_ID, 58, '2026-07-10T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000009', 'Cybersécurité — Introduction', 'Panorama des menaces, bonnes pratiques et sécurité défensive.', '99999999-9999-4999-8999-999999999997', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2025-2026', 'students', 2740, FATOU, 112, '2026-09-20T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000010', 'Cryptographie — TP', 'Chiffrement symétrique et asymétrique, exercices pratiques.', '99999999-9999-4999-8999-999999999990', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '2025-2026', 'students', 1340, FATOU, 45, '2026-09-22T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000011', 'Génie logiciel — Mémoire UML', 'Mémoire de fin de cycle sur la modélisation UML d’un système.', '99999999-9999-4999-8999-999999999999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '2024-2025', 'students', 4120, SALIF, 33, '2026-08-28T09:00:00.000Z'),
  doc('b0000000-0000-4000-8000-000000000012', 'Mathématiques discrètes — Cours', 'Logique, ensembles, relations, graphes et combinatoire.', '99999999-9999-4999-8999-999999999998', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2025-2026', 'public', 2860, ADMIN_ID, 77, '2026-09-08T09:00:00.000Z'),
];

export const proposals: DbDocument[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    title: 'Réseaux informatiques — Fiche de synthèse',
    description: 'Fiche de synthèse sur l’adressage IP et le routage.',
    subjectId: '99999999-9999-4999-8999-999999999994',
    typeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
    academicYear: '2025-2026',
    visibility: 'students',
    status: 'pending',
    originalFilename: 'reseaux-fiche-synthese.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 520 * 1024,
    uploadedBy: AWA,
    downloadCount: 0,
    createdAt: daysAgoIso(1),
    publishedAt: null,
    rejectionReason: null,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    title: 'Algorithmique — Fiche de révision',
    description: 'Fiche synthétique sur les tris et la complexité.',
    subjectId: '99999999-9999-4999-8999-999999999991',
    typeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
    academicYear: '2025-2026',
    visibility: 'students',
    status: 'pending',
    originalFilename: 'algorithmique-fiche-revision.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 480 * 1024,
    uploadedBy: AWA,
    downloadCount: 0,
    createdAt: daysAgoIso(6),
    publishedAt: null,
    rejectionReason: null,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    title: 'Bases de données — Annales 2025',
    description: 'Recueil d’annales corrigées de la matière.',
    subjectId: '99999999-9999-4999-8999-999999999992',
    typeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    academicYear: '2025-2026',
    visibility: 'students',
    status: 'pending',
    originalFilename: 'bdd-annales-2025.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1520 * 1024,
    uploadedBy: AWA,
    downloadCount: 0,
    createdAt: daysAgoIso(4),
    publishedAt: null,
    rejectionReason: null,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    title: 'Programmation web — TP noté',
    description: 'Énoncé du TP noté de programmation web.',
    subjectId: '99999999-9999-4999-8999-999999999993',
    typeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    academicYear: '2024-2025',
    visibility: 'students',
    status: 'rejected',
    originalFilename: 'web-tp-note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 620 * 1024,
    uploadedBy: AWA,
    downloadCount: 0,
    createdAt: daysAgoIso(21),
    publishedAt: null,
    rejectionReason: 'Document déjà présent dans la bibliothèque (voir « Programmation web — Examen 2025 »).',
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    title: 'Génie logiciel — Cours complet 2025',
    description: 'Support de cours sur les méthodes agiles et le cycle en V.',
    subjectId: '99999999-9999-4999-8999-999999999999',
    typeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    academicYear: '2025-2026',
    visibility: 'students',
    status: 'pending',
    originalFilename: 'gl-cours-complet-2025.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 3080 * 1024,
    uploadedBy: SALIF,
    downloadCount: 0,
    createdAt: daysAgoIso(3),
    publishedAt: null,
    rejectionReason: null,
  },
];

export const resetRequests: DbResetRequest[] = [
  { id: 'd0000000-0000-4000-8000-000000000001', userId: '44444444-4444-4444-8444-444444444444', status: 'pending', createdAt: '2026-10-09T11:00:00.000Z' },
  { id: 'd0000000-0000-4000-8000-000000000002', userId: '15151515-1515-4515-8515-151515151515', status: 'pending', createdAt: '2026-10-10T11:00:00.000Z' },
  { id: 'd0000000-0000-4000-8000-000000000003', userId: '14141414-1414-4414-8414-141414141414', status: 'done', createdAt: '2026-10-02T11:00:00.000Z' },
];

const levelById = new Map(CATALOG.levels.map((level) => [level.id, level]));
const programById = new Map(CATALOG.programs.map((program) => [program.id, program]));
const subjectById = new Map(CATALOG.subjects.map((subject) => [subject.id, subject]));
const typeById = new Map(CATALOG.documentTypes.map((type) => [type.id, type]));
const userById = new Map(users.map((user) => [user.id, user]));

export function toPublicUser({ password: _password, ...rest }: MockUser): AuthUser {
  void _password;
  return rest;
}

export function toAdminUser(user: MockUser): AdminUser {
  return {
    ...toPublicUser(user),
    programName: user.programId ? programById.get(user.programId)?.name ?? null : null,
    levelName: user.levelId ? levelById.get(user.levelId)?.name ?? null : null,
  };
}

export function toDocumentItem(item: DbDocument): DocumentItem {
  const subject = subjectById.get(item.subjectId);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    subjectId: item.subjectId,
    subjectName: subject?.name ?? 'Matière inconnue',
    levelId: subject?.levelId ?? null,
    levelName: subject ? levelById.get(subject.levelId)?.name ?? null : null,
    programId: subject?.programId ?? null,
    programName: subject ? programById.get(subject.programId)?.name ?? null : null,
    typeId: item.typeId,
    typeName: typeById.get(item.typeId)?.name ?? 'Autre',
    academicYear: item.academicYear,
    visibility: item.visibility,
    status: item.status,
    originalFilename: item.originalFilename,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    uploadedBy: item.uploadedBy,
    uploaderName: item.uploadedBy ? userById.get(item.uploadedBy)?.fullName ?? null : null,
    downloadCount: item.downloadCount,
    createdAt: item.createdAt,
    publishedAt: item.publishedAt,
  };
}

export function toProposalItem(item: DbDocument) {
  const created = new Date(item.createdAt).getTime();
  const expires = created + PROPOSAL_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return {
    ...toDocumentItem(item),
    rejectionReason: item.rejectionReason,
    fileExpiresAt: new Date(expires).toISOString(),
    contentAvailable: Date.now() < expires,
  };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function getUserById(id: string | null): MockUser | undefined {
  return id ? userById.get(id) : undefined;
}

export function getUserByEmail(email: string): MockUser | undefined {
  return users.find((user) => user.email === email);
}

export function readSession(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSession(userId: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore (stockage indisponible)
  }
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `temp-${Math.random().toString(16).slice(2)}`;

export type { UserRole, UserStatus };
