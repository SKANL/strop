import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Plus, CheckSquare, FileText, Lock, Calendar } from 'lucide-react';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
// Breadcrumb rendered in header now
import { Button } from '@/components/ui/button';
import {
  DailyTimeline,
  LogDetail,
  BitacoraFilters,
} from '@/components/features/bitacora';
import { ManualEntryDialog } from '@/components/features/bitacora/manual-entry-dialog';
import { OfficialComposer } from '@/components/features/bitacora/official-composer';
import { getBitacoraEntriesAction } from '@/app/actions/bitacora.actions';

export const dynamic = 'force-dynamic';

export default async function BitacoraDayPage({
  params,
}: {
  params: Promise<{ projectId: string; date: string }>;
}) {
  const { projectId, date: dateParam } = await params;

  const result = await getBitacoraEntriesAction(projectId, dateParam);
  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">No se pudo cargar la bitácora para este día</p>
        <Button asChild className="mt-4">
          <Link href="/bitacora">Volver a bitácora</Link>
        </Button>
      </div>
    );
  }

  const { project, isClosed, entries } = result.data;

  let currentDate: Date;
  try {
    currentDate = parseISO(dateParam);
  } catch {
    currentDate = new Date();
  }

  // Initial UI state for client components will be handled client-side; pass entries as props
  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Bitácora', url: '/bitacora' },
          { title: project.name, url: `/bitacora/${projectId}` },
          { title: format(currentDate, "d 'de' MMMM, yyyy", { locale: es }) },
        ]}
      />

      {/* Filtros */}
      <BitacoraFilters
        onFiltersChange={() => {}}
        showDateFilter={false}
      />

      {/* Header placeholder: interactive controls handled in client components */}
      <div className="flex items-center gap-2">
        {/* Client components will render their own interactive controls */}
      </div>

      <DailyTimeline
        date={currentDate}
        entries={entries as any}
        onDateChange={() => {}}
        onEntryClick={undefined}
        selectable={false}
        selectedEntries={[]}
        onSelect={() => {}}
        isClosed={isClosed}
      />

      {/* Modals: included so client layer can hydrate them as needed */}
      <LogDetail entry={null as any} open={false} onClose={() => {}} />
      <ManualEntryDialog open={false} onOpenChange={() => {}} projectId={projectId} date={currentDate} />
      <OfficialComposer open={false} onOpenChange={() => {}} entries={[]} projectName={project.name} date={currentDate} onClosureSuccess={() => {}} />
    </div>
  );
}
