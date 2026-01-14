'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getTeamMembersAction } from '@/app/actions/team.actions';
import { assignIncidentAction } from '@/app/actions/incidents.actions';

interface IncidentAssignProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export function IncidentAssign({ open, onOpenChange, incidentId }: IncidentAssignProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    
    async function fetchUsers() {
      setLoading(true);
      const res = await getTeamMembersAction();
      if (!res.success || !res.data) {
        setUsers([]);
        setLoading(false);
        return;
      }

      setUsers(res.data.map((m) => ({ id: m.id, name: m.name, role: m.role })));
      setLoading(false);
    }
    
    fetchUsers();
  }, [open]);

  const handleAssign = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await assignIncidentAction(incidentId, selectedUser);
      if (!res.success) {
        toast.error(res.error || 'Error al asignar la incidencia');
        return;
      }
      toast.success('Incidencia asignada exitosamente');
      onOpenChange(false);
    } catch {
      toast.error('Error al asignar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar usuario..." />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                <CommandGroup heading="Usuarios disponibles">
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => setSelectedUser(user.id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4',
                          selectedUser === user.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
        <div className="p-2 border-t">
          <Button
            className="w-full"
            size="sm"
            disabled={!selectedUser || isSubmitting}
            onClick={handleAssign}
          >
            {isSubmitting ? 'Asignando...' : 'Confirmar asignación'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
