import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Changer le mot de passe',
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}