import type { Metadata } from 'next';
import { getIncidentsAction } from '@/app/actions/incidents.actions';
import { IncidentList } from '@/components/features/incidents/incident-list';

export const metadata: Metadata = {
  title: 'Incidencias',
};

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const result = await getIncidentsAction();
  
  if (!result.success) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-muted-foreground">{result.error || 'Error al cargar incidencias'}</p>
        </div>
      </div>
    );
  }
  
  const incidents = result.data || [];
  
  return <IncidentList incidents={incidents as any} />;
}
