'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { completeOnboardingAction } from '@/app/actions/auth.actions';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await completeOnboardingAction(formData);

      if (result.success) {
        toast.success('¡Organización creada! Redirigiendo...');
        // The action should redirect, but just in case
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Error al crear la organización');
      }
    } catch (error) {
      // If there's a redirect, Next.js throws an error that's normal
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest;
        if (digest?.includes('NEXT_REDIRECT')) {
          return; // Redirect successful
        }
      }
      toast.error('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 50);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>
            <span className="text-2xl font-bold">Strop</span>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Crear tu organización</CardTitle>
            <CardDescription>
              Completa tu perfil para empezar a usar Strop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nombre de la organización</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  placeholder="Tu empresa constructora"
                  required
                  disabled={isLoading}
                  autoComplete="organization"
                  onChange={(e) => {
                    // Auto-generate slug
                    setSlug(generateSlug(e.target.value));
                  }}
                />
              </div>

              {/* Organization Slug */}
              <div className="space-y-2">
                <Label htmlFor="organizationSlug">
                  Slug de la organización{' '}
                  <span className="text-xs text-muted-foreground">(URL-friendly)</span>
                </Label>
                <Input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  placeholder="tu-empresa"
                  required
                  disabled={isLoading}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="^[a-z0-9\\-]+$"
                  title="Solo caracteres minúsculos, números y guiones"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará en URLs de tu organización
                </p>
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select defaultValue="STARTER" name="plan">
                  <SelectTrigger id="plan" disabled={isLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">
                      <div>
                        <p className="font-medium">Starter</p>
                        <p className="text-xs text-muted-foreground">Para empezar</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="PROFESSIONAL">
                      <div>
                        <p className="font-medium">Professional</p>
                        <p className="text-xs text-muted-foreground">Para crecer</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="ENTERPRISE">
                      <div>
                        <p className="font-medium">Enterprise</p>
                        <p className="text-xs text-muted-foreground">Para escalar</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creando organización...' : 'Crear organización'}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
              <p className="text-sm text-blue-900">
                Después podrás invitar a tu equipo a colaborar en tu organización.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          ¿Necesitas ayuda? Contacta a{' '}
          <a href="mailto:support@strop.com" className="underline hover:text-primary">
            support@strop.com
          </a>
        </p>
      </div>
    </div>
  );
}
