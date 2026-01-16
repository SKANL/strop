'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck, RefreshCw, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { resendConfirmationEmailAction } from '@/app/actions/auth.actions';
import { toast } from 'sonner';

export function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleResendEmail() {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);

    try {
      const result = await resendConfirmationEmailAction(email);

      if (result.success) {
        toast.success('Email reenviado exitosamente');
        // Start 60 second cooldown
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error || 'Error al reenviar el email');
      }
    } catch (error) {
      toast.error('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <MailCheck className="size-4" />
        <AlertTitle>Revisa tu bandeja de entrada</AlertTitle>
        <AlertDescription>
          {email ? (
            <>
              Enviamos un email de confirmación a <strong>{email}</strong>.
              Haz clic en el enlace del email para activar tu cuenta.
            </>
          ) : (
            <>
              Enviamos un email de confirmación a tu correo.
              Haz clic en el enlace del email para activar tu cuenta.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <strong>¿No recibiste el email?</strong>
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Revisa tu carpeta de spam o correo no deseado</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Asegúrate de que escribiste correctamente tu email</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>El email puede tardar unos minutos en llegar</span>
          </li>
        </ul>
      </div>

      {email && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResendEmail}
          disabled={isResending || resendCooldown > 0}
        >
          {isResending ? (
            <>
              <RefreshCw className="mr-2 size-4 animate-spin" />
              Reenviando...
            </>
          ) : resendCooldown > 0 ? (
            <>Espera {resendCooldown}s para reenviar</>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Reenviar email de confirmación
            </>
          )}
        </Button>
      )}

      <Alert variant="default" className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
        <AlertCircle className="size-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          Una vez confirmes tu email, podrás crear tu organización y empezar a usar Strop.
        </AlertDescription>
      </Alert>
    </div>
  );
}
