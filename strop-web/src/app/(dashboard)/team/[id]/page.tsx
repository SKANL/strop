'use server'

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Breadcrumb rendered in header now
import { Button } from '@/components/ui/button';
import { UserDetail } from '@/components/features/team';
import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { getTeamMemberAction } from '@/app/actions/team.actions';
import type { User } from '@/types';

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTeamMemberAction(id);
  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Usuario no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/team">Volver al equipo</Link>
        </Button>
      </div>
    );
  }

  const user = result.data as User & { projects: { id: string; name: string }[] };

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Equipo', url: '/team' },
          { title: user.full_name },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Perfil del usuario
        </h1>
      </div>

      <UserDetail user={user} />
    </div>
  );
}
