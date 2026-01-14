import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import SetBreadcrumbs from '@/components/layout/set-breadcrumbs';
import { Button } from '@/components/ui/button';
import { UserEditForm } from '@/components/features/team';
import { getTeamMemberAction } from '@/app/actions/team.actions';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditTeamMemberPage({
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

  const user = result.data as User;

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        items={[
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Equipo', url: '/team' },
          { title: user.full_name, url: `/team/${id}` },
          { title: 'Editar' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/team/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar usuario</h1>
          <p className="text-muted-foreground">
            Modifica la información de {user.full_name}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserEditForm user={user} />
      </div>
    </div>
  );
}
