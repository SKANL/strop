'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpAction } from '@/app/actions/auth.actions';
import { toast } from 'sonner';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get invitation params
  const inviteToken = searchParams.get('invite_token');
  const invitedEmail = searchParams.get('email');
  
  // If user is invited, they join an existing org, so we don't need company name
  const isInvited = !!inviteToken;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUpAction(formData);

      if (result.success) {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
        router.push('/login');
      } else {
        toast.error(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      toast.error('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        {/* Hidden inputs for invitation */}
        {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
        
        {/* Form fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Juan Pérez"
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              disabled={isLoading || (isInvited && !!invitedEmail)}
              defaultValue={invitedEmail || ''}
              readOnly={isInvited && !!invitedEmail}
              className={isInvited && !!invitedEmail ? "bg-muted text-muted-foreground" : ""}
              autoComplete="email"
            />
            {/* If disabled, we need a hidden input to submit the value */}
            {isInvited && !!invitedEmail && (
              <input type="hidden" name="email" value={invitedEmail} />
            )}
          </div>
          
          {!isInvited && (
            <div className="grid gap-2">
              <Label htmlFor="company">Nombre de la empresa</Label>
              <Input
                id="company"
                name="company"
                type="text"
                placeholder="Constructora ABC"
                required={!isInvited}
                disabled={isLoading}
                autoComplete="organization"
              />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={isLoading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isInvited ? 'Unirse al equipo' : 'Crear cuenta'}
          </Button>
        </div>

        <div className="text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="underline underline-offset-4">
            Inicia sesión
          </Link>
        </div>
      </div>
    </form>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
