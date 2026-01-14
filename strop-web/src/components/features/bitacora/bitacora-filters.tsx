'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { EventSource } from '@/types';

interface BitacoraFiltersProps {
  onFiltersChange?: (filters: BitacoraFilterValues) => void;
  projects?: { id: string; name: string }[];
  selectedProjectId?: string;
  showDateFilter?: boolean;
}

interface BitacoraFilterValues {
  date?: Date;
  source?: EventSource | 'ALL';
  search?: string;
  projectId?: string;
}

export function BitacoraFilters({ 
  onFiltersChange, 
  projects = [], 
  selectedProjectId,
  showDateFilter = true 
}: BitacoraFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [source, setSource] = useState<EventSource | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(selectedProjectId);

  const activeFilters = [
    date && date.toDateString() !== new Date().toDateString(),
    source !== 'ALL',
    search.length > 0,
    projectId && projectId !== selectedProjectId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDate(new Date());
    setSource('ALL');
    setSearch('');
    setProjectId(selectedProjectId);
    onFiltersChange?.({});
  };

  return (
    <div className="space-y-4">
      {/* Selector de proyecto */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Proyecto:</label>
          <Select
            value={projectId}
            onValueChange={(value) => {
              setProjectId(value);
              onFiltersChange?.({ date, source, search, projectId: value });
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tabs para filtro por source */}
      <Tabs
        value={source}
        onValueChange={(value) => {
          setSource(value as EventSource | 'ALL');
          onFiltersChange?.({ date, source: value as EventSource | 'ALL', search });
        }}
      >
        <TabsList>
          <TabsTrigger value="ALL">Todos</TabsTrigger>
          <TabsTrigger value="INCIDENT">Incidencia</TabsTrigger>
          <TabsTrigger value="MANUAL">Manual</TabsTrigger>
          <TabsTrigger value="MOBILE">Móvil</TabsTrigger>
          <TabsTrigger value="SYSTEM">Sistema</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Otros filtros */}
      <div className="flex flex-wrap items-center gap-4">
        {showDateFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-[200px]',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  onFiltersChange?.({ date: newDate, source, search });
                }}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Buscar en bitácora..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFiltersChange?.({ date, source, search: e.target.value });
            }}
          />
        </div>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar ({activeFilters})
          </Button>
        )}
      </div>
    </div>
  );
}
