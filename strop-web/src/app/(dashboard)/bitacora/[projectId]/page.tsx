import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock, Clock, AlertCircle } from 'lucide-react';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBitacoraProjectAction } from '@/app/actions/bitacora.actions';

export const metadata: Metadata = {
  title: 'Calendario de Bitácora',
};

export const dynamic = 'force-dynamic';
export default async function BitacoraProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getBitacoraProjectAction(projectId);
  if (!result.success || !result.data) {
    notFound();
  }
  const data = result.data;
  
  if (!data) {
    notFound();
  }
  
  const { project, days } = data;

  const openDays = days.filter(d => !d.isClosed);
  const closedDays = days.filter(d => d.isClosed);
  const totalEntries = days.reduce((sum, day) => sum + day.entriesCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Bitácora', url: '/bitacora' },
          { title: project.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bitacora">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">{project.location || 'Sin ubicación'}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Días pendientes</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {openDays.length}
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Requieren cierre oficial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Días cerrados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {closedDays.length}
              <Lock className="h-6 w-6 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Con validez legal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total entradas</CardDescription>
            <CardTitle className="text-3xl">
              {totalEntries}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Eventos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Días pendientes de cerrar */}
      {openDays.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Días pendientes de cerrar
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {openDays.map((day) => (
              <Link key={day.date} href={`/bitacora/${projectId}/${day.date}`}>
                <Card className="hover:border-orange-500/50 transition-colors cursor-pointer border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {new Date(day.date).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </CardTitle>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        Abierto
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {day.entriesCount} {day.entriesCount === 1 ? 'entrada' : 'entradas'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Días cerrados */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-500" />
          Días cerrados (inmutables)
        </h2>
        {closedDays.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8">
            <CardDescription>No hay días cerrados aún</CardDescription>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {closedDays.map((day) => (
              <Link key={day.date} href={`/bitacora/${projectId}/${day.date}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {new Date(day.date).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </CardTitle>
                      <Lock className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {day.entriesCount} {day.entriesCount === 1 ? 'entrada' : 'entradas'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
