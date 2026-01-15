import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
// Breadcrumb rendered in header now
import { ProjectForm } from '@/components/features/projects';
import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { getProjectDetailAction } from '@/app/actions/projects.actions';
import type { Project } from '@/types';

export const metadata: Metadata = {
  title: 'Editar proyecto',
};

export const dynamic = 'force-dynamic';
 

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProjectDetailAction(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const { project } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Proyectos', url: '/projects' },
          { title: project.name, url: `/projects/${id}` },
          { title: 'Editar' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar proyecto</h1>
          <p className="text-muted-foreground">Modifica la información del proyecto</p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectForm mode="edit" project={project} />
      </div>
    </div>
  );
}
