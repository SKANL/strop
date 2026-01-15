import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Breadcrumb rendered in header now
import { ProjectDetail } from '@/components/features/projects';
import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { getProjectDetailAction } from '@/app/actions/projects.actions';
import type { Project, User, Incident, UserRole } from '@/types';

export const metadata: Metadata = {
  title: 'Detalle del proyecto',
};

export const dynamic = 'force-dynamic';
 
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProjectDetailAction(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const { project, members, incidents } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Proyectos', url: '/projects' },
          { title: project.name },
        ]}
      />

      {/* Project Detail */}
      <ProjectDetail project={project} members={members} incidents={incidents} />
    </div>
  );
}
