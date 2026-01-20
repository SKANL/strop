import type { Metadata } from 'next';
import { getProjectsAction } from '@/app/actions/projects.actions';
import { ProjectList } from '@/components/features/projects/project-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Proyectos',
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
  
  return <ProjectList projects={projects as any} />;
}
