'use client';

import { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserRole } from '@/types';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  projects: number;
  isActive: boolean;
}

interface TeamListProps {
  teamMembers: TeamMember[];
}

const roleConfig: Record<UserRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  OWNER: { label: 'Propietario', variant: 'default' },
  SUPERINTENDENT: { label: 'Superintendente', variant: 'secondary' },
  RESIDENT: { label: 'Residente', variant: 'outline' },
  CABO: { label: 'Cabo', variant: 'outline' },
};

export function TeamList({ teamMembers }: TeamListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Set<UserRole>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter team members
  const filteredMembers = teamMembers.filter((member) => {
    // Search filter
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = roleFilter.size === 0 || roleFilter.has(member.role);

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && member.isActive) ||
      (statusFilter === 'inactive' && !member.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleRoleFilter = (role: UserRole) => {
    const newFilter = new Set(roleFilter);
    if (newFilter.has(role)) {
      newFilter.delete(role);
    } else {
      newFilter.add(role);
    }
    setRoleFilter(newFilter);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter(new Set());
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || roleFilter.size > 0 || statusFilter !== 'all';

  return (
    <>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={roleFilter.has('OWNER')}
              onCheckedChange={() => toggleRoleFilter('OWNER')}
            >
              Propietario
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={roleFilter.has('SUPERINTENDENT')}
              onCheckedChange={() => toggleRoleFilter('SUPERINTENDENT')}
            >
              Superintendente
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={roleFilter.has('RESIDENT')}
              onCheckedChange={() => toggleRoleFilter('RESIDENT')}
            >
              Residente
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={roleFilter.has('CABO')}
              onCheckedChange={() => toggleRoleFilter('CABO')}
            >
              Cabo
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'all'}
              onCheckedChange={() => setStatusFilter('all')}
            >
              Todos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'active'}
              onCheckedChange={() => setStatusFilter('active')}
            >
              Activos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === 'inactive'}
              onCheckedChange={() => setStatusFilter('inactive')}
            >
              Inactivos
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Team table */}
      {filteredMembers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <CardTitle className="mb-2">
            {teamMembers.length === 0 ? 'No hay miembros' : 'No se encontraron resultados'}
          </CardTitle>
          <CardDescription className="mb-4">
            {teamMembers.length === 0
              ? 'Invita a tu primer miembro del equipo.'
              : 'Intenta ajustar los filtros de búsqueda.'}
          </CardDescription>
          {teamMembers.length === 0 && (
            <Button asChild>
              <Link href="/team/invite">
                <Mail className="mr-2 h-4 w-4" />
                Invitar miembro
              </Link>
            </Button>
          )}
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
              {filteredMembers.map((member) => {
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
    </>
  );
}
