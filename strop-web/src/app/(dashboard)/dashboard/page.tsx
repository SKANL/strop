import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FolderKanban,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  getDashboardStatsAction,
  getRecentActivityAction,
  getRecentProjectsAction,
  getMapDataAction,
} from '@/app/actions/dashboard.actions';
import { DashboardMap } from '@/features/map/components/DashboardMap';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

// Stats card component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-green-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [statsResult, activityResult, projectsResult, mapResult] = await Promise.all([
    getDashboardStatsAction(),
    getRecentActivityAction(),
    getRecentProjectsAction(),
    getMapDataAction(),
  ]);

  // Handle errors
  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {statsResult.error || 'Error al cargar el dashboard'}
          </p>
        </div>
      </div>
    );
  }

  const stats = statsResult.data;
  const recentActivity = activityResult.success ? activityResult.data || [] : [];
  const recentProjects = projectsResult.success ? projectsResult.data || [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de tus proyectos y actividad reciente.
        </p>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Stats and Map */}
        <div className="space-y-6 lg:col-span-8">
          {/* Stats grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Proyectos Activos"
              value={stats.activeProjects + stats.pausedProjects}
              description={`${stats.activeProjects} en progreso${stats.pausedProjects > 0 ? `, ${stats.pausedProjects} pausado${stats.pausedProjects > 1 ? 's' : ''}` : ''}`}
              icon={FolderKanban}
            />
            <StatsCard
              title="Incidencias Abiertas"
              value={stats.totalOpenIncidents}
              description={stats.criticalIncidents > 0 ? `${stats.criticalIncidents} crítica${stats.criticalIncidents > 1 ? 's' : ''}` : 'Ninguna crítica'}
              icon={AlertTriangle}
            />
            <StatsCard
              title="Miembros del Equipo"
              value={stats.teamMembers}
              description="En todos los proyectos"
              icon={Users}
            />
            <StatsCard
              title="Incidencias Cerradas"
              value={stats.closedThisMonth}
              description="Este mes"
              icon={TrendingUp}
            />
          </div>

          {/* Map Section */}
          <div className="min-h-[400px] w-full">
             {mapResult.success && mapResult.data ? (
                <DashboardMap data={mapResult.data} />
             ) : (
                <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-muted-foreground">
                        No se pudo cargar el mapa
                    </CardContent>
                </Card>
             )}
          </div>
        </div>

        {/* Right Column: Stacked Cards */}
        <div className="space-y-6 lg:col-span-4">
          {/* Recent activity */}
          <Card className="h-full lg:h-auto">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas acciones en tus proyectos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {item.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.project} · {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay actividad reciente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="h-full lg:h-auto">
            <CardHeader>
              <CardTitle>Proyectos</CardTitle>
              <CardDescription>Tus proyectos más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center">
                      <div
                        className={`size-2 rounded-full ${
                          project.healthStatus === 'critical'
                            ? 'bg-red-500'
                            : project.healthStatus === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <div className="ml-4 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {project.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.status === 'ACTIVE' ? 'Activo' : project.status === 'PAUSED' ? 'Pausado' : 'Completado'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay proyectos
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
