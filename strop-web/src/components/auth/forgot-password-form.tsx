'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPasswordAction } from '@/app/actions/auth.actions';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const result = await resetPasswordAction(formData);

      if (result.success) {
        setEmailSent(true);
        toast.success('Email enviado. Revisa tu bandeja de entrada.');
      } else {
        toast.error(result.error || 'Error al enviar el email');
      }
    } catch (error) {
      toast.error('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="grid gap-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Email enviado</h3>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar enlace de recuperación
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </Button>
      </div>
    </form>
  );
}
