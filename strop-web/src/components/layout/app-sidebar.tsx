'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Users,
  Settings,
  Search,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { OrgSwitcher } from './org-switcher';
import { NavMain, type NavMainItem } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import type { Organization, User, Project } from '@/types';

// Navigation items for the main menu
const mainNavItems: NavMainItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Proyectos',
    url: '/projects',
    icon: FolderKanban,
  },
  {
    title: 'Incidencias',
    url: '/incidents',
    icon: AlertTriangle,
    // TODO: Replace this hard-coded badge with a dynamic count from the backend.
    // Backend guidance (Supabase): count open/incidents for current organization
    // Server-side example using `createServerClient`:
    // const supabase = await createServerClient({ cookies });
    // const { count, error } = await supabase
    //   .from('incidents')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('organization_id', currentOrganization.id)
    //   .eq('status', 'OPEN');
    // Pass the resulting `count` into `AppSidebar` as a prop (e.g. `incidentCount`) and
    // render it via the `NavMainItem.badge` property instead of a hard-coded value.
  },

  {
    title: 'Equipo',
    url: '/team',
    icon: Users,
  },
];

const secondaryNavItems: NavMainItem[] = [
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[];
  currentOrganization: Organization;
  user: User;
  projects: Project[];
}

export function AppSidebar({
  organizations,
  currentOrganization,
  user,
  projects,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher
          organizations={organizations}
          currentOrganization={currentOrganization}
        />
      </SidebarHeader>

      <SidebarContent>
        {/* Search shortcut */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-muted-foreground"
                  onClick={() => {
                    // Trigger command menu
                    document.dispatchEvent(
                      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                    );
                  }}
                >
                  <Search className="size-4" />
                  <span>Buscar...</span>
                  <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main navigation */}
        <NavMain items={mainNavItems} label="Menú" />

        {/* Projects list */}
        <NavProjects projects={projects} maxVisible={5} />

        {/* Secondary navigation */}
        <NavMain items={secondaryNavItems} label="Soporte" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
