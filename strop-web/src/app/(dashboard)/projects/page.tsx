import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProjectsAction } from '@/app/actions/projects.actions';
import type { ProjectStatus } from '@/types';

export const metadata: Metadata = {
  title: 'Proyectos',
};

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  ACTIVE: { label: 'Activo', variant: 'default' },
  PAUSED: { label: 'Pausado', variant: 'secondary' },
  COMPLETED: { label: 'Completado', variant: 'outline' },
};

async function getProjects() {
  const result = await getProjectsAction();
  
  if (!result.success) {
    console.error('Error fetching projects:', result.error);
    return [];
  }
  
  return result.data ?? [];
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus proyectos de construcción.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proyecto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proyectos..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">No hay proyectos</CardTitle>
          <CardDescription className="mb-4">
            Crea tu primer proyecto para comenzar.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const status = statusConfig[project.status as ProjectStatus];
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.location}</CardDescription>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project.members} miembros</span>
                      <span>·</span>
                      <span>{project.incidents} incidencias</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
