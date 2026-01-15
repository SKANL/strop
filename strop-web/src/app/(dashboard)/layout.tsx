import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SiteHeader, CommandMenu } from '@/components/layout';
import { BreadcrumbsProvider } from '@/components/layout/breadcrumbs-context';
import { createServerComponentClient } from '@/lib/supabase/server';
import { createOrganizationsService } from '@/lib/services/organizations.service';
import { createProjectsService } from '@/lib/services/projects.service';
import type { Organization, User, Project } from '@/types';

async function getLayoutData() {
  const supabase = await createServerComponentClient();
  
  // Get current user - middleware already checked auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  // If no user, return null (middleware should have caught this)
  if (!authUser) {
    return null;
  }
  
  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();
  
  if (!userProfile) {
    return null;
  }
  
  const user: User = {
    id: userProfile.id,
    email: userProfile.email,
    full_name: userProfile.full_name,
    avatar_url: userProfile.profile_picture_url,
    role: 'RESIDENT',
    organization_id: userProfile.current_organization_id ?? '',
    is_active: userProfile.is_active ?? true,
    phone: null,
    created_at: userProfile.created_at ?? new Date().toISOString(),
    updated_at: userProfile.updated_at ?? new Date().toISOString(),
  };

  // Get user's organizations
  const organizationsService = createOrganizationsService(supabase);
  const { data: userOrgs } = await organizationsService.getUserOrganizations();
  
  const organizations: Organization[] = (userOrgs ?? []).map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo_url: org.logo_url,
    created_at: org.created_at ?? new Date().toISOString(),
    updated_at: org.updated_at ?? new Date().toISOString(),
  }));
  
  let currentOrganization = organizations.find(
    o => o.id === userProfile.current_organization_id
  ) ?? organizations[0];
  
  // If no organizations, user needs onboarding
  // Note: middleware protects this route, so redirect here is safe
  if (!currentOrganization && organizations.length === 0) {
    redirect('/onboarding');
  }
  
  currentOrganization = currentOrganization ?? {
    id: '',
    name: 'Sin organización',
    slug: 'none',
    logo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Get user's role in current organization
  if (currentOrganization.id) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', user.id)
      .single();
    
    if (membership) {
      user.role = membership.role as User['role'];
    }
  }
  
  // Get projects for current organization
  const projectsService = createProjectsService(supabase);
  const { data: orgProjects } = currentOrganization.id 
    ? await projectsService.getProjectsByOrganization({ organizationId: currentOrganization.id })
    : { data: [] };
  
  const projects: Project[] = (orgProjects ?? []).map(proj => ({
    id: proj.id,
    organization_id: proj.organization_id,
    name: proj.name,
    description: null, // Field doesn't exist in schema
    location: proj.location,
    latitude: null, // Field doesn't exist in schema
    longitude: null, // Field doesn't exist in schema
    status: proj.status ?? 'ACTIVE',
    start_date: proj.start_date,
    expected_end_date: proj.end_date, // Schema has end_date, not expected_end_date
    cover_image_url: null, // Field doesn't exist in schema
    created_by: proj.created_by,
    created_at: proj.created_at ?? new Date().toISOString(),
    updated_at: proj.updated_at ?? new Date().toISOString(),
  }));

  return { currentOrganization, organizations, user, projects };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  
  const layoutData = await getLayoutData();
  
  // If no layout data, show error with logout option
  if (!layoutData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Error al cargar datos del usuario.</p>
          <p className="text-sm text-muted-foreground">
            Por favor cierra sesión e inicia sesión nuevamente.
          </p>
          <form action="/api/auth/signout" method="post">
            <button 
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  const { currentOrganization, organizations, user, projects } = layoutData;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        organizations={organizations}
        currentOrganization={currentOrganization}
        user={user}
        projects={projects}
      />
      <SidebarInset>
        <BreadcrumbsProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </BreadcrumbsProvider>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  );
}
