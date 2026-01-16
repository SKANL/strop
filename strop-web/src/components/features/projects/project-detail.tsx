'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Pencil,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/shared';
import { AddProjectMemberModal } from './add-member-modal';
import type { Project, ProjectStatus, User, Incident } from '@/types';

interface ProjectDetailProps {
  project: Project;
  members: User[];
  incidents: Incident[];
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  ACTIVE: { label: 'Activo', variant: 'default' },
  PAUSED: { label: 'Pausado', variant: 'secondary' },
  COMPLETED: { label: 'Completado', variant: 'outline' },
};

export function ProjectDetail({ project, members, incidents }: ProjectDetailProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const status = statusConfig[project.status];
  const openIncidents = incidents.filter((i) => i.status !== 'CLOSED').length;
  const criticalIncidents = incidents.filter((i) => i.priority === 'CRITICAL').length;

  // TODO: Calculate real progress based on project milestones or tasks
  const progress = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {project.location && (
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {project.location}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPauseDialog(true)}>
                {project.status === 'PAUSED' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Reanudar proyecto
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar proyecto
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Archivar proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">asignados al proyecto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {criticalIncidents} críticas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fecha fin</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.expected_end_date
                ? format(new Date(project.expected_end_date), 'dd MMM', { locale: es })
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">fecha estimada</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="members">
            Miembros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="incidents">
            Incidencias ({incidents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {project.description || 'Sin descripción disponible.'}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fechas del proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inicio</span>
                  <span className="font-medium">
                    {project.start_date
                      ? format(new Date(project.start_date), 'PPP', { locale: es })
                      : 'No definida'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin estimado</span>
                  <span className="font-medium">
                    {project.expected_end_date
                      ? format(new Date(project.expected_end_date), 'PPP', {
                          locale: es,
                        })
                      : 'No definida'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Última actualización:{' '}
                  {format(new Date(project.updated_at), 'PPP', { locale: es })}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">Miembros del equipo</h3>
            <Button size="sm" onClick={() => setShowAddMember(true)}>Agregar miembro</Button>
            <AddProjectMemberModal open={showAddMember} onOpenChange={setShowAddMember} projectId={project.id} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Avatar>
                    <AvatarFallback>
                      {member.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">Incidencias del proyecto</h3>
            <Button size="sm" asChild>
              <Link href={`/incidents/new?project=${project.id}`}>
                Nueva incidencia
              </Link>
            </Button>
          </div>
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No hay incidencias</h3>
                <p className="text-sm text-muted-foreground">
                  Este proyecto no tiene incidencias registradas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {incidents.slice(0, 5).map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.type} · {incident.status}
                      </p>
                    </div>
                    <Badge
                      variant={
                        incident.priority === 'CRITICAL' ? 'destructive' : 'secondary'
                      }
                    >
                      {incident.priority}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {incidents.length > 5 && (
                <Button variant="link" asChild className="w-full">
                  <Link href={`/incidents?project=${project.id}`}>
                    Ver todas ({incidents.length})
                  </Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfirmDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        title={project.status === 'PAUSED' ? 'Reanudar proyecto' : 'Pausar proyecto'}
        description={
          project.status === 'PAUSED'
            ? '¿Estás seguro de que deseas reanudar este proyecto?'
            : '¿Estás seguro de que deseas pausar este proyecto? Los miembros no podrán crear nuevas incidencias.'
        }
        confirmLabel={project.status === 'PAUSED' ? 'Reanudar' : 'Pausar'}
        onConfirm={() => {
          // TODO: API call
          setShowPauseDialog(false);
        }}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Archivar proyecto"
        description="¿Estás seguro de que deseas archivar este proyecto? Esta acción no eliminará los datos pero el proyecto no será visible en la lista principal."
        confirmLabel="Archivar"
        variant="destructive"
        onConfirm={() => {
          // TODO: API call
          setShowDeleteDialog(false);
        }}
      />
    </div>
  );
}
