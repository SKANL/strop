import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Filter, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { getTeamMembersAction } from '@/app/actions/team.actions';
import type { UserRole } from '@/types';

export const metadata: Metadata = {
  title: 'Equipo',
};

export const dynamic = 'force-dynamic';

const roleConfig: Record<UserRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  OWNER: { label: 'Propietario', variant: 'default' },
  SUPERINTENDENT: { label: 'Superintendente', variant: 'secondary' },
  RESIDENT: { label: 'Residente', variant: 'outline' },
  CABO: { label: 'Cabo', variant: 'outline' },
};

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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu organización.
          </p>
        </div>
        <Button asChild>
          <Link href="/team/invite">
            <Mail className="mr-2 h-4 w-4" />
            Invitar miembro
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar miembros..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Team table */}
      {teamMembers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">No hay miembros</CardTitle>
          <CardDescription className="mb-4">
            Invita a tu primer miembro del equipo.
          </CardDescription>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const role = roleConfig[member.role];
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/team/${member.id}`} className="font-medium hover:underline">
                            {member.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </TableCell>
                    <TableCell>{member.projects} proyectos</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-2 rounded-full ${
                            member.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-sm">
                          {member.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/team/${member.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
