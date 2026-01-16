'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'

import { Button } from '@/registry/new-york-v4/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/registry/new-york-v4/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/new-york-v4/ui/command'
import { Avatar, AvatarFallback } from '@/registry/new-york-v4/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { getTeamMembersAction } from '@/app/actions/team.actions'
import { addProjectMemberAction } from '@/app/actions/projects.actions'
import { PROJECT_ROLES } from '@/types/supabase'

interface AddProjectMemberModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProjectMemberModal({ projectId, open, onOpenChange }: AddProjectMemberModalProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>(PROJECT_ROLES[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getTeamMembersAction().then((res) => {
      if (!res.success || !res.data) {
        setUsers([])
        setLoading(false)
        return
      }
      setUsers(res.data.map((m) => ({ id: m.id, name: m.name, role: m.role })))
      setLoading(false)
    })
  }, [open])

  const roleLabels: Record<string, string> = {
    SUPERINTENDENT: 'Superintendente',
    RESIDENT: 'Residente',
    CABO: 'Cabo',
  }

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return toast.error('Selecciona al menos un usuario')
    setSubmitting(true)
    try {
      const results = await Promise.all(
        selectedUsers.map((userId) =>
          addProjectMemberAction(projectId, userId, selectedRole as any)
        )
      )

      const failed = results.filter((r) => !r.success)
      if (failed.length > 0) {
        toast.error(`Fallaron ${failed.length} de ${results.length} asignaciones`)
        return
      }

      toast.success(`Agregados ${results.length} miembro(s) al proyecto`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Error agregando miembro(s)')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar miembro al proyecto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Buscar usuario</label>
            <div className="mt-2">
              <Command>
                <CommandInput placeholder="Buscar por nombre o correo..." />
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
                              onSelect={() => toggleUser(user.id)}
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
                                  selectedUsers.includes(user.id) ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Rol en el proyecto</label>
            <div className="mt-2">
              <Select onValueChange={(v) => setSelectedRole(v)} defaultValue={selectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r] ?? r}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="w-full flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={handleAdd} disabled={selectedUsers.length === 0 || submitting}>
              {submitting ? 'Agregando...' : 'Agregar miembro'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
