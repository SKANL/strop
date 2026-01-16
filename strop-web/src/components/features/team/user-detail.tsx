'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  Folder,
  Edit,
  UserX,
  KeyRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared';
import { toast } from 'sonner';
import { deactivateTeamMemberAction, resetUserPasswordAction } from '@/app/actions/team.actions';
import type { User, UserRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface UserDetailProps {
  user: User & {
    projects?: { id: string; name: string }[];
  };
  recentActivity?: Array<{
    action: string;
    time: string;
    type: 'incident' | 'bitacora';
  }>;
  stats?: {
    incidentsReported: number;
    incidentsClosed: number;
    bitacoraEntries: number;
  };
}

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  OWNER: { label: 'Propietario', color: 'bg-purple-500' },
  SUPERINTENDENT: { label: 'Superintendente', color: 'bg-blue-500' },
  RESIDENT: { label: 'Residente', color: 'bg-green-500' },
  CABO: { label: 'Cabo', color: 'bg-orange-500' },
};

export function UserDetail({ user, recentActivity = [], stats }: UserDetailProps) {
  const router = useRouter();
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

  const role = roleLabels[user.role];
  const isActive = user.is_active;

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  const handleDeactivate = async () => {
    try {
      const res = await deactivateTeamMemberAction(user.id);
      if (!res.success) {
        toast.error(res.error || 'Error al desactivar usuario');
        return;
      }

      toast.success('Usuario desactivado');
      setShowDeactivateConfirm(false);
      // Optionally navigate away if desired
      // router.push('/team')
    } catch {
      toast.error('Error al desactivar usuario');
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await resetUserPasswordAction(user.email);
      if (!res.success) {
        toast.error(res.error || 'Error al enviar correo de restablecimiento');
        return;
      }

      toast.success('Correo de restablecimiento enviado');
      setShowResetPasswordConfirm(false);
    } catch {
      toast.error('Error al enviar correo');
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <div className={`h-2 w-2 rounded-full ${role.color}`} />
                      {role.label}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/team/${user.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowResetPasswordConfirm(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Restablecer contraseña
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setShowDeactivateConfirm(true)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium">{user.phone || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Miembro desde</p>
                    <p className="text-sm font-medium">
                      {format(new Date(user.created_at), 'PPP', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="text-sm font-medium">
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proyectos asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {user.projects && user.projects.length > 0 ? (
                <div className="space-y-2">
                  {user.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proyectos asignados
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4 text-sm">
                  {recentActivity.map((activity, idx) => {
                    const colorMap = {
                      incident: activity.action.includes('Cerró') ? 'bg-green-500' : 'bg-orange-500',
                      bitacora: 'bg-blue-500',
                    };
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className={`h-2 w-2 rounded-full ${colorMap[activity.type]} mt-1.5`} />
                        <div>
                          <p>{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Incidencias reportadas</span>
                  <span className="font-medium">{stats?.incidentsReported ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Incidencias cerradas</span>
                  <span className="font-medium">{stats?.incidentsClosed ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entradas en bitácora</span>
                  <span className="font-medium">{stats?.bitacoraEntries ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
        title="¿Desactivar usuario?"
        description={`${user.full_name} ya no podrá acceder a la plataforma. Podrás reactivarlo más adelante.`}
        confirmLabel="Desactivar"
        variant="destructive"
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={showResetPasswordConfirm}
        onOpenChange={setShowResetPasswordConfirm}
        title="¿Restablecer contraseña?"
        description={`Se enviará un correo a ${user.email} con instrucciones para crear una nueva contraseña.`}
        confirmLabel="Enviar correo"
        onConfirm={handleResetPassword}
      />
    </>
  );
}
