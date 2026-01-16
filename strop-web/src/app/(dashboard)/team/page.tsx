import type { Metadata } from 'next';

import { TeamList } from '@/components/features/team/team-list';
import { getTeamMembersAction } from '@/app/actions/team.actions';

export const metadata: Metadata = {
  title: 'Equipo',
};

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const result = await getTeamMembersAction();
  
  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-semibold mb-2">Error al cargar el equipo</h2>
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    );
  }

  const teamMembers = result.data ?? [];
  
  return (
    <div className="flex flex-col gap-6">
      <TeamList teamMembers={teamMembers} />
    </div>
  );
}
