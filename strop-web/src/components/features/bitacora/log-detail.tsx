'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NextImage from 'next/image';
import { MapPin, Clock, Image as ImageIcon, Edit, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createBrowserClient } from '@/lib/supabase/client';
import type { BitacoraEntry } from './log-card';
import type { EventSource } from '@/types';

interface LogDetailProps {
  entry: BitacoraEntry | null;
  open: boolean;
  onClose: () => void;
}

const typeLabels: Record<EventSource, string> = {
  INCIDENT: 'Incidencia',
  MANUAL: 'Manual',
  MOBILE: 'Móvil',
  SYSTEM: 'Sistema',
};

interface Photo {
  id: string;
  url: string;
}

export function LogDetail({ entry, open, onClose }: LogDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry || !open) return;
    
    async function fetchPhotos() {
      setLoading(true);
      // TODO: Photos are connected to incidents (see DB table `photos`) and stored
      // in the `incident-photos` storage bucket. Replace this placeholder with
      // a proper Supabase-backed implementation:
      // 1) Query the `photos` table for the related incident_id:
      //    const supabase = createBrowserClient()
      //    const { data: rows } = await supabase.from('photos')
      //      .select('id,storage_path')
      //      .eq('incident_id', <INCIDENT_ID>)
      // 2) For private buckets create signed URLs server-side or via an authorized
      //    client and map them to { id, url } objects. Example (server-side):
      //    const { data } = await supabase.storage.from('incident-photos')
      //      .createSignedUrl(path, 60)
      // 3) setPhotos(mappedPhotos)
      // NOTE: Prefer generating signed URLs on the server to avoid exposing
      // service_role keys or improper permissions.
      setPhotos([]);
      setLoading(false);
    }
    
    fetchPhotos();
  }, [entry, open]);

  if (!entry) return null;

  const initials = entry.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-left">
                Detalle de entrada
              </SheetTitle>
              <SheetDescription className="text-left">
                {format(new Date(entry.created_at), "EEEE, d 'de' MMMM 'a las' HH:mm", {
                  locale: es,
                })}
              </SheetDescription>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            {typeLabels[entry.source]}
          </Badge>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Content */}
            <div>
              <h4 className="text-sm font-medium mb-2">Contenido</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entry.content}
              </p>
            </div>

            {/* Author */}
            <div>
              <h4 className="text-sm font-medium mb-2">Registrado por</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{entry.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Photos */}
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : photos.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Fotos ({photos.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-video rounded-lg overflow-hidden bg-muted relative"
                    >
                      <NextImage
                        src={photo.url}
                        alt="Foto de bitácora"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Separator />

            {/* Metadata */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Información adicional</h4>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Creado: {format(new Date(entry.created_at), 'PPpp', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {/*
                    TODO: Replace static location with backend data.
                    Store location either in `bitacora_entries.metadata.location` or
                    use `incidents.location` when the entry is linked to an incident.

                    Server-side example to fetch location from `bitacora_entries`:
                    const { data } = await supabase
                      .from('bitacora_entries')
                      .select('metadata')
                      .eq('id', <ENTRY_ID>)
                      .single()
                    const location = data?.metadata?.location
                  */}
                  <span>Ubicación: {(entry as any).metadata?.location ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
