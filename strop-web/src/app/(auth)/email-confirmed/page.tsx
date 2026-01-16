import type { Metadata } from 'next';
import { Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Email confirmado',
};

export default function EmailConfirmedPage() {
  return (
    <>
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        Strop
      </a>

      {/* Success card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">¡Email confirmado!</CardTitle>
          <CardDescription>
            Tu cuenta ha sido activada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50">
            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              ¡Todo listo!
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Ahora puedes crear tu organización y empezar a usar Strop.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/onboarding">
                Crear mi organización
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Ir al dashboard
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-semibold">Próximos pasos:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                <span>Crea tu organización y personaliza tu perfil</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                <span>Invita a tu equipo a colaborar</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                <span>Empieza a gestionar tus proyectos</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
