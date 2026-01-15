import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InviteForm } from '@/components/features/team';
import { getOrganizationProjectsAction } from '@/app/actions/team.actions';

export const dynamic = 'force-dynamic';

export default async function InviteTeamMemberPage() {
  const res = await getOrganizationProjectsAction();
  const projects = res.success ? res.data ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitar miembro</h1>
          <p className="text-muted-foreground">
            Envía una invitación para unirse a tu organización
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <InviteForm initialProjects={projects} />
      </div>
    </div>
  );
}
