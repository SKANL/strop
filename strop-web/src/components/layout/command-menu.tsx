'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  FolderKanban,
  AlertTriangle,
  ClipboardList,
  Users,
  LayoutDashboard,
  Plus,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Escribe un comando o busca..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        <CommandGroup heading="Acciones rápidas">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/projects/new'))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Nuevo proyecto</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/incidents/new'))}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Nueva incidencia</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/team/invite'))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Invitar miembro</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegación">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/projects'))}
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Proyectos</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/incidents'))}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Incidencias</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/bitacora'))}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Bitácora</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/team'))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Equipo</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configuración">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración general</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/profile'))}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mi perfil</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
