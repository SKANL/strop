'use client';

import { useState } from 'react';
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
import {
  Card,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { IncidentStatus, IncidentPriority } from '@/types';

interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  project: string;
  assignee: string | null;
  createdAt: string;
}

interface IncidentListProps {
  incidents: Incident[];
}

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

export function IncidentList({ incidents }: IncidentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | IncidentPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');

  const filteredIncidents = incidents.filter((incident) => {
    // Search filter
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.assignee && incident.assignee.toLowerCase().includes(searchQuery.toLowerCase()));

    // Priority filter
    const matchesPriority =
      priorityFilter === 'all' || incident.priority === priorityFilter;

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || incident.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = 
    searchQuery !== '' || priorityFilter !== 'all' || statusFilter !== 'all';

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={priorityFilter === 'all'}
              onCheckedChange={() => setPriorityFilter('all')}
            >
              Todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={priorityFilter === 'CRITICAL'}
              onCheckedChange={() => setPriorityFilter('CRITICAL')}
            >
              Crítica
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={priorityFilter === 'NORMAL'}
              onCheckedChange={() => setPriorityFilter('NORMAL')}
            >
              Normal
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'all'}
              onCheckedChange={() => setStatusFilter('all')}
            >
              Todos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'OPEN'}
              onCheckedChange={() => setStatusFilter('OPEN')}
            >
              Abiertas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'ASSIGNED'}
              onCheckedChange={() => setStatusFilter('ASSIGNED')}
            >
              Asignadas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'CLOSED'}
              onCheckedChange={() => setStatusFilter('CLOSED')}
            >
              Cerradas
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Incidents table */}
      {filteredIncidents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">
            {incidents.length === 0 ? 'No hay incidencias' : 'No se encontraron resultados'}
          </CardTitle>
          <CardDescription className="mb-4">
            {incidents.length === 0
              ? 'Aún no hay incidencias reportadas.'
              : 'Intenta ajustar los filtros de búsqueda.'}
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
              {filteredIncidents.map((incident) => {
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
