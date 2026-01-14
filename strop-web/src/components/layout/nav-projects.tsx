'use client';

import { Folder, MoreHorizontal, Share, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Project, ProjectStatus } from '@/types';

interface NavProjectsProps {
  projects: Project[];
  maxVisible?: number;
}

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-gray-400',
};

export function NavProjects({ projects, maxVisible = 5 }: NavProjectsProps) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const visibleProjects = projects.slice(0, maxVisible);
  const hasMore = projects.length > maxVisible;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Proyectos</SidebarGroupLabel>
      <SidebarMenu>
        {visibleProjects.map((project) => {
          const projectUrl = `/projects/${project.id}`;
          const isActive = pathname.startsWith(projectUrl);

          return (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={projectUrl}>
                  <div
                    className={`size-2 rounded-full ${statusColors[project.status]}`}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">Más opciones</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align={isMobile ? 'end' : 'start'}
                >
                  <DropdownMenuItem asChild>
                    <Link href={projectUrl}>
                      <Folder className="text-muted-foreground" />
                      <span>Ver proyecto</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="text-muted-foreground" />
                    <span>Compartir</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="text-destructive" />
                    <span>Archivar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}
        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/70">
              <Link href="/projects">
                <MoreHorizontal className="text-sidebar-foreground/70" />
                <span>Ver todos ({projects.length})</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
