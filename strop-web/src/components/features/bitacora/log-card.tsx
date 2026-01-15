'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  FileEdit,
  Smartphone,
  Settings,
  MoreVertical,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EventSource } from '@/types';

export interface BitacoraEntry {
  id: string;
  source: EventSource;
  title: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
  photos?: number;
}

interface LogCardProps {
  entry: BitacoraEntry;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const sourceConfig: Record<
  EventSource,
  { icon: React.ElementType; label: string; color: string }
> = {
  INCIDENT: { icon: AlertTriangle, label: 'Incidencia', color: 'bg-red-500' },
  MANUAL: { icon: FileEdit, label: 'Manual', color: 'bg-blue-500' },
  MOBILE: { icon: Smartphone, label: 'Móvil', color: 'bg-green-500' },
  SYSTEM: { icon: Settings, label: 'Sistema', color: 'bg-gray-500' },
};

export function LogCard({ entry, onClick, selectable, selected, onSelect }: LogCardProps) {
  const config = sourceConfig[entry.source];
  const Icon = config.icon;

  const initials = entry.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div
      className={cn(
        'group relative flex gap-4 rounded-lg border bg-card p-4 transition-colors',
        onClick && !selectable && 'cursor-pointer hover:bg-accent',
        selected && 'border-primary bg-accent'
      )}
      onClick={!selectable ? onClick : undefined}
    >
      {selectable && (
        <div className="flex items-start pt-1">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(entry.id, !!checked)}
          />
        </div>
      )}

      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            config.color
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{config.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.created_at), 'HH:mm', { locale: es })}
              </span>
            </div>
            {entry.title && (
              <h4 className="text-sm font-medium">{entry.title}</h4>
            )}
            <p className="text-sm leading-relaxed">{entry.content}</p>
          </div>

          {!selectable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span>{entry.user.name}</span>
          </div>
          {entry.photos && entry.photos > 0 && (
            <span>{entry.photos} foto{entry.photos > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
