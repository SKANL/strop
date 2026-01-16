import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { Button } from '@/components/ui/button';
import { getBitacoraEntriesAction } from '@/app/actions/bitacora.actions';
import { BitacoraDayClient } from '@/components/features/bitacora/bitacora-day-client';

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

      <BitacoraDayClient
        projectId={projectId}
        projectName={project.name}
        date={currentDate}
        initialEntries={entries as any}
        isClosed={isClosed}
      />
    </div>
  );
}
