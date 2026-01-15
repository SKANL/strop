import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Filter, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { getIncidentsAction } from '@/app/actions/incidents.actions';
import type { IncidentStatus, IncidentPriority } from '@/types';

export const metadata: Metadata = {
  title: 'Incidencias',
};

export const dynamic = 'force-dynamic';

const statusConfig: Record<
  IncidentStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  OPEN: { label: 'Abierta', variant: 'destructive' },
  ASSIGNED: { label: 'Asignada', variant: 'default' },
  CLOSED: { label: 'Cerrada', variant: 'outline' },
};

const priorityConfig: Record<IncidentPriority, { label: string; className: string }> = {
  CRITICAL: { label: 'Crítica', className: 'text-red-600 font-medium' },
  NORMAL: { label: 'Normal', className: 'text-muted-foreground' },
};

export default async function IncidentsPage() {
  const result = await getIncidentsAction();
  
  if (!result.success) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-muted-foreground">{result.error || 'Error al cargar incidencias'}</p>
        </div>
      </div>
    );
  }
  
  const incidents = result.data || [];
  
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-muted-foreground">
            Seguimiento de todas las incidencias reportadas.
          </p>
        </div>
        <Button asChild>
          <Link href="/incidents/new">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Nueva incidencia
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar incidencias..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Incidents table */}
      {incidents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">No hay incidencias</CardTitle>
          <CardDescription className="mb-4">
            Aún no hay incidencias reportadas.
          </CardDescription>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => {
                const status = statusConfig[incident.status];
                const priority = priorityConfig[incident.priority];
                return (
                  <TableRow 
                    key={incident.id} 
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Link href={`/incidents/${incident.id}`} className="hover:underline">
                        {incident.title}
                      </Link>
                    </TableCell>
                    <TableCell>{incident.project}</TableCell>
                    <TableCell className={priority.className}>
                      {priority.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {incident.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {incident.assignee
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{incident.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sin asignar
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {incident.createdAt}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
