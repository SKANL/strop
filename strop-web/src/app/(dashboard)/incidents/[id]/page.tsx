'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MoreVertical,
  ArrowLeft,
  MapPin,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  Edit,
  Loader2,
} from 'lucide-react';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IncidentAssign, IncidentClose } from '@/components/features/incidents';
import { ConfirmDialog } from '@/components/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Incident, IncidentStatus, IncidentPriority, IncidentType } from '@/types';

const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
  OPEN: { label: 'Abierta', color: 'bg-yellow-500' },
  ASSIGNED: { label: 'Asignada', color: 'bg-blue-500' },
  CLOSED: { label: 'Cerrada', color: 'bg-green-500' },
};

const priorityConfig: Record<IncidentPriority, { label: string; variant: 'default' | 'destructive' }> = {
  NORMAL: { label: 'Normal', variant: 'default' },
  CRITICAL: { label: 'Crítica', variant: 'destructive' },
};

const typeLabels: Record<IncidentType, string> = {
  ORDER_INSTRUCTION: 'Orden/Instrucción',
  REQUEST_QUERY: 'Solicitud/Consulta',
  CERTIFICATION: 'Certificación',
  INCIDENT_NOTIFICATION: 'Notificación',
};

type IncidentWithDetails = Incident & {
  project_name: string;
  reported_by_name: string;
  assigned_to_name: string | null;
};

type Comment = {
  id: string;
  content: string;
  user: string;
  createdAt: string;
};

type TimelineEvent = {
  action: string;
  user: string;
  date: string;
};

type Photo = {
  id: string;
  url: string;
};

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<IncidentWithDetails | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function fetchIncident() {
      const supabase = createBrowserClient();
      
      // Get incident with related data
      const { data: incidentData } = await supabase
        .from('incidents')
        .select(`
          *,
          projects:project_id (name),
          reporter:created_by (full_name),
          assignee:assigned_to (full_name)
        `)
        .eq('id', id)
        .single();
      
      if (incidentData) {
        const inc: IncidentWithDetails = {
          id: incidentData.id,
          project_id: incidentData.project_id,
          title: incidentData.title,
          description: incidentData.description,
          type: incidentData.type as IncidentType,
          priority: incidentData.priority as IncidentPriority,
          status: incidentData.status as IncidentStatus,
          location: incidentData.location || null,
          created_by: incidentData.created_by,
          assigned_to: incidentData.assigned_to,
          closed_at: incidentData.closed_at,
          closed_by: incidentData.closed_by,
          closed_notes: incidentData.closed_notes,
          created_at: incidentData.created_at || new Date().toISOString(),
          project_name: (incidentData.projects as { name?: string } | null)?.name ?? 'Proyecto',
          reported_by_name: (incidentData.reporter as { full_name?: string } | null)?.full_name ?? 'Usuario',
          assigned_to_name: (incidentData.assignee as { full_name?: string } | null)?.full_name ?? null,
        };
        setIncident(inc);
        
        // Get photos
        const { data: photosData } = await supabase
          .from('photos')
          .select('id, storage_path')
          .eq('incident_id', id);
        
        if (photosData) {
          setPhotos(photosData.map(p => ({ id: p.id, url: p.storage_path })));
        }
        
        // Get comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select(`
            id,
            text,
            created_at,
            users:created_by (full_name)
          `)
          .eq('incident_id', id)
          .order('created_at', { ascending: true });
        
        if (commentsData) {
          setComments(commentsData.map(c => ({
            id: c.id,
            content: c.text,
            user: (c.users as { full_name?: string } | null)?.full_name ?? 'Usuario',
            createdAt: c.created_at || new Date().toISOString(),
          })));
        }
        
        // Build timeline from incident data
        const timelineEvents: TimelineEvent[] = [
          {
            action: 'Incidencia creada',
            user: inc.reported_by_name,
            date: inc.created_at,
          },
        ];
        
        if (inc.assigned_to_name) {
          timelineEvents.push({
            action: `Asignada a ${inc.assigned_to_name}`,
            user: 'Sistema',
            date: inc.created_at,
          });
        }
        
        if (inc.closed_at) {
          timelineEvents.push({
            action: 'Incidencia cerrada',
            user: 'Sistema',
            date: inc.closed_at,
          });
        }
        
        setTimeline(timelineEvents);
      }
      
      setLoading(false);
    }
    
    fetchIncident();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Incidencia no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/incidents">Volver a incidencias</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[incident.status];
  const priority = priorityConfig[incident.priority];

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Incidencias', url: '/incidents' },
          { title: incident.title },
        ]}
      />

      {/* Content */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {incident.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{typeLabels[incident.type]}</span>
                    <span>·</span>
                    <span>
                      {format(new Date(incident.created_at), 'PPP', { locale: es })}
                    </span>
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
                    <Link href={`/incidents/${id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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
                    Fotos ({photos.length})
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
                      {photos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No hay fotos adjuntas
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              <Image
                                src={photo.url}
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
                                {comment.user
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {comment.user}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'PPp', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}

                      {incident.status !== 'CLOSED' && (
                        <>
                          <Separator />
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">YO</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder="Escribe un comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                              />
                              <div className="flex justify-end">
                                <Button size="sm" disabled={!newComment.trim()}>
                                  Comentar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
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
                          {incident.reported_by_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {incident.reported_by_name}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Asignado a</p>
                      {incident.status !== 'CLOSED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setShowAssign(true)}
                        >
                          {incident.assigned_to ? 'Cambiar' : 'Asignar'}
                        </Button>
                      )}
                    </div>
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

      <IncidentAssign
        open={showAssign}
        onOpenChange={setShowAssign}
        incidentId={id}
      />

      <IncidentClose
        open={showClose}
        onOpenChange={setShowClose}
        incidentId={id}
      />

      <ConfirmDialog
        open={showReopenConfirm}
        onOpenChange={setShowReopenConfirm}
        title="¿Reabrir incidencia?"
        description="La incidencia volverá a estar activa y se notificará a los responsables."
        confirmLabel="Reabrir"
        onConfirm={() => {
          // TODO: Reopen incident
          setShowReopenConfirm(false);
        }}
      />
    </div>
  );
}
