import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <>
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        Strop
      </a>

      {/* Forgot password card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu
            contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
