import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MobileOnlyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso Móvil Requerido</CardTitle>
          <CardDescription className="pt-2 text-base">
            Esta plataforma web está reservada para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Tu rol actual requiere el uso de nuestra aplicación móvil para realizar tus actividades diarias, reportar incidentes y consultar la bitácora.
          </p>
          
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm font-medium text-blue-800">
              Descarga la App de Strop
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Disponible pronto en iOS y Android
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/signout">
                Cerrar Sesión
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
