import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Calendar, MapPin } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBitacoraSummaryAction } from '@/app/actions/bitacora.actions';

export const metadata: Metadata = {
  title: 'Bitácora',
};

export const dynamic = 'force-dynamic';


export default async function BitacoraPage() {
  const result = await getBitacoraSummaryAction();
  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-semibold mb-2">Error al cargar bitácora</h2>
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    );
  }

  const projects = result.data ?? [];
  
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bitácora de Obra (BESOP)</h1>
          <p className="text-muted-foreground">
            Registro legal obligatorio por proyecto - Selecciona un proyecto para continuar
          </p>
        </div>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">No hay proyectos</CardTitle>
          <CardDescription>
            Crea un proyecto primero para empezar a usar la bitácora.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalDays = project.openDays + project.closedDays;
            const completionPercentage = totalDays > 0 ? (project.closedDays / totalDays) * 100 : 0;
            
            return (
              <Link key={project.id} href={`/bitacora/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.location || 'Sin ubicación'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {project.status === 'ACTIVE' ? 'Activo' : project.status === 'PAUSED' ? 'Pausado' : 'Completado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Días pendientes de cerrar */}
                    {project.openDays > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600">
                          {project.openDays} {project.openDays === 1 ? 'día pendiente' : 'días pendientes'} de cerrar
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Todos los días cerrados</span>
                      </div>
                    )}

                    {/* Progreso de cierres */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Días cerrados</span>
                        <span className="font-medium">{project.closedDays}/{totalDays}</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                      <div>
                        <p className="text-muted-foreground">Total entradas</p>
                        <p className="font-semibold">{project.totalEntries}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última entrada</p>
                        <p className="font-semibold">
                          {project.lastEntry 
                            ? new Date(project.lastEntry).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sobre la Bitácora de Obra (BESOP)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            La Bitácora Electrónica de Seguimiento de Obra Pública (BESOP) es un documento legal obligatorio
            que registra cronológicamente todos los eventos relevantes durante la ejecución de la obra.
          </p>
          <p className="font-medium text-foreground">
            Los días cerrados son inmutables y tienen validez legal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
