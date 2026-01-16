import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  MessageSquare,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { IncidentDetailClient } from '@/components/features/incidents/incident-detail-client';
import { getIncidentAction, getIncidentCommentsAction } from '@/app/actions/incidents.actions';
import type { IncidentStatus, IncidentPriority, IncidentType } from '@/types';

const typeLabels: Record<IncidentType, string> = {
  ORDER_INSTRUCTION: 'Orden/Instrucción',
  REQUEST_QUERY: 'Solicitud/Consulta',
  CERTIFICATION: 'Certificación',
  INCIDENT_NOTIFICATION: 'Notificación',
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [incidentResult, commentsResult] = await Promise.all([
    getIncidentAction(id),
    getIncidentCommentsAction(id),
  ]);
  
  if (!incidentResult.success || !incidentResult.data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencia no encontrada</h1>
          <p className="text-muted-foreground">{incidentResult.error || 'Error al cargar la incidencia'}</p>
        </div>
      </div>
    );
  }
  
  const incident = incidentResult.data;
  const comments = commentsResult.success ? commentsResult.data || [] : [];

  const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
    OPEN: { label: 'Abierta', color: 'bg-yellow-500' },
    ASSIGNED: { label: 'Asignada', color: 'bg-blue-500' },
    CLOSED: { label: 'Cerrada', color: 'bg-green-500' },
  };

  const priorityConfig: Record<IncidentPriority, { label: string; variant: 'default' | 'destructive' }> = {
    NORMAL: { label: 'Normal', variant: 'default' },
    CRITICAL: { label: 'Crítica', variant: 'destructive' },
  };

  const status = statusConfig[incident.status];
  const priority = priorityConfig[incident.priority];

  // Build timeline
  const timeline: { action: string; user: string; date: string }[] = [
    {
      action: 'Incidencia creada',
      user: incident.created_by_name,
      date: incident.created_at,
    },
  ];

  if (incident.assigned_to_name) {
    timeline.push({
      action: `Asignada a ${incident.assigned_to_name}`,
      user: 'Sistema',
      date: incident.created_at,
    });
  }

  if (incident.closed_at) {
    timeline.push({
      action: 'Incidencia cerrada',
      user: 'Sistema',
      date: incident.closed_at,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with interactive controls - delegated to client component */}
      <IncidentDetailClient
        incidentId={id}
        incident={incident}
        status={status}
        priority={priority}
        typeLabel={typeLabels[incident.type]}
      />

      {/* Content (mostly static, can be server-rendered) */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {incident.description}
                </p>
                {incident.location && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{incident.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="photos">
              <TabsList>
                <TabsTrigger value="photos">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Fotos ({incident.photos.length})
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comentarios ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Clock className="mr-2 h-4 w-4" />
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {incident.photos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay fotos adjuntas
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {incident.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <Image
                              src={photo.storage_path}
                              alt="Evidencia"
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay comentarios
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {comment.author_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.author_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), 'PPp', {
                                  locale: es,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {index < timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium">{event.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.user} ·{' '}
                              {format(new Date(event.date), 'PPp', { locale: es })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Reportado por</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {incident.created_by_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {incident.created_by_name}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Asignado a</p>
                  {incident.assigned_to_name ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {incident.assigned_to_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {incident.assigned_to_name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin asignar</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span>
                    {format(new Date(incident.created_at), 'PP', { locale: es })}
                  </span>
                </div>
                {incident.closed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cerrado</span>
                    <span>
                      {format(new Date(incident.closed_at), 'PP', { locale: es })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
