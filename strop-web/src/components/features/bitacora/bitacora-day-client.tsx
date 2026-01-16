'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DailyTimeline } from './daily-timeline';
import { LogDetail } from './log-detail';
import { ManualEntryDialog } from './manual-entry-dialog';
import { OfficialComposer } from './official-composer';
import { BitacoraFilters } from './bitacora-filters';
import type { BitacoraEntry } from './log-card';
import { closeDayAction } from '@/app/actions/bitacora.actions';

interface BitacoraDayClientProps {
  projectId: string;
  projectName: string;
  date: Date;
  initialEntries: BitacoraEntry[];
  isClosed: boolean;
}

export function BitacoraDayClient({
  projectId,
  projectName,
  date,
  initialEntries,
  isClosed,
}: BitacoraDayClientProps) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<BitacoraEntry | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleEntryClick = (entry: BitacoraEntry) => {
    setSelectedEntry(entry);
  };

  const handleDateChange = (newDate: Date) => {
    const dateStr = format(newDate, 'yyyy-MM-dd');
    router.push(`/bitacora/${projectId}/${dateStr}`);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedEntries((prev) =>
      selected ? [...prev, id] : prev.filter((eid) => eid !== id)
    );
  };

  const handleComposeDocument = () => {
    if (initialEntries.length === 0) {
      toast.error('No hay entradas para componer', {
        description: 'Agrega al menos una entrada antes de cerrar el día',
      });
      return;
    }
    setComposerOpen(true);
  };

  const handleClosureSuccess = async (data: { official_content: string; pin?: string }) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const result = await closeDayAction(projectId, dateStr, data.official_content, data.pin);
      
      if (!result.success) {
        toast.error(result.error || 'Error al cerrar el día');
        return;
      }

      toast.success('Día cerrado exitosamente', {
        description: 'El contenido es ahora inmutable y tiene validez legal',
      });

      // Refresh the page to show closed state
      router.refresh();
      setComposerOpen(false);
    } catch (error) {
      toast.error('Error al cerrar el día');
      console.error(error);
    }
  };

  return (
    <>
      {/* Filters */}
      <BitacoraFilters
        onFiltersChange={() => {
          // Filters are not needed on day view, but component is shown for consistency
        }}
        showDateFilter={false}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isClosed && (
            <Button onClick={() => setManualEntryOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar entrada manual
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isClosed && initialEntries.length > 0 && (
            <Button onClick={handleComposeDocument} variant="default" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Componer documento oficial
            </Button>
          )}
          {isClosed && (
            <Button variant="secondary" size="sm" disabled>
              <Lock className="mr-2 h-4 w-4" />
              Día cerrado
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <DailyTimeline
        date={date}
        entries={initialEntries}
        onDateChange={handleDateChange}
        onEntryClick={handleEntryClick}
        selectable={selectionMode}
        selectedEntries={selectedEntries}
        onSelect={handleSelect}
        isClosed={isClosed}
      />

      {/* Modals */}
      <LogDetail
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      <ManualEntryDialog
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
        projectId={projectId}
        date={date}
      />

      <OfficialComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        entries={initialEntries}
        projectName={projectName}
        date={date}
        onClosureSuccess={handleClosureSuccess}
      />
    </>
  );
}
