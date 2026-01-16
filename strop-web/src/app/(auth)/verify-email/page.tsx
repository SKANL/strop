import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Building2, MailCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmailVerificationContent } from '@/components/auth/email-verification-content';

export const metadata: Metadata = {
  title: 'Verifica tu email',
};

export default function VerifyEmailPage() {
  return (
    <>
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        Strop
      </a>

      {/* Verification card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Verifica tu correo electrónico</CardTitle>
          <CardDescription>
            Te hemos enviado un email de confirmación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Cargando...</div>}>
            <EmailVerificationContent />
          </Suspense>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground">
        ¿Ya confirmaste tu email?{' '}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Inicia sesión aquí
        </Link>
      </div>
    </>
  );
}
