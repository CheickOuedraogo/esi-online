import type { Metadata } from 'next';
import { AdminUserDetailView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Utilisateur',
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  return <AdminUserDetailView id={id} editing={edit === '1'} />;
}
