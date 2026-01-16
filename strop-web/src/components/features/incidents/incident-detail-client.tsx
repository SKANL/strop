'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MoreVertical,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
} from 'lucide-react';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IncidentAssign, IncidentClose } from '@/components/features/incidents';
import { ConfirmDialog } from '@/components/shared';
import { reopenIncidentAction } from '@/app/actions/incidents.actions';
import { toast } from 'sonner';
import type { IncidentStatus, IncidentPriority } from '@/types';

interface IncidentDetailClientProps {
  incidentId: string;
  incident: {
    project_id: string;
    project_name: string;
    title: string;
    type: string;
    status: IncidentStatus;
    priority: IncidentPriority;
    assigned_to: string | null;
    created_at: string;
  };
  status: { label: string; color: string };
  priority: { label: string; variant: 'default' | 'destructive' };
  typeLabel: string;
}

export function IncidentDetailClient({
  incidentId,
  incident,
  status,
  priority,
  typeLabel,
}: IncidentDetailClientProps) {
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  const handleReopen = async () => {
    setIsReopening(true);
    try {
      const result = await reopenIncidentAction(incidentId, incident.project_id);
      if (result.success) {
        toast.success('Incidencia reabierta exitosamente');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al reabrir la incidencia');
      }
    } catch (error) {
      toast.error('Error inesperado al reabrir la incidencia');
    } finally {
      setIsReopening(false);
      setShowReopenConfirm(false);
    }
  };

  return (
    <>
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Incidencias', url: '/incidents' },
          { title: incident.title },
        ]}
      />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{typeLabel}</span>
                  <span>·</span>
                  <span>{format(new Date(incident.created_at), 'PPP', { locale: es })}</span>
                  <span>·</span>
                  <Link
                    href={`/projects/${incident.project_id}`}
                    className="hover:underline text-primary"
                  >
                    {incident.project_name}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-14">
              <div className={`h-2 w-2 rounded-full ${status.color}`} />
              <span className="text-sm">{status.label}</span>
              <Badge variant={priority.variant}>
                {incident.priority === 'CRITICAL' && (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                {priority.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {incident.status !== 'CLOSED' && (
              <Button onClick={() => setShowClose(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAssign(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {incident.assigned_to ? 'Reasignar' : 'Asignar'}
                </DropdownMenuItem>
                {incident.status === 'CLOSED' && (
                  <DropdownMenuItem onClick={() => setShowReopenConfirm(true)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Reabrir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/incidents/${incidentId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <IncidentAssign
        open={showAssign}
        onOpenChange={setShowAssign}
        incidentId={incidentId}
      />

      <IncidentClose
        open={showClose}
        onOpenChange={setShowClose}
        incidentId={incidentId}
      />

      <ConfirmDialog
        open={showReopenConfirm}
        onOpenChange={setShowReopenConfirm}
        title="¿Reabrir incidencia?"
        description="La incidencia volverá a estar activa y se notificará a los responsables."
        confirmLabel="Reabrir"
        onConfirm={handleReopen}
        loading={isReopening}
      />
    </>
  );
}
