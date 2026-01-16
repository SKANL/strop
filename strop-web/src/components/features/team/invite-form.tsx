'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { inviteMemberAction } from '@/app/actions/team.actions';
import type { UserRole } from '@/types';

const inviteFormSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  role: z.enum(['OWNER', 'SUPERINTENDENT', 'RESIDENT', 'CABO'], {
    message: 'Selecciona un rol',
  }),
  project_id: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const roles: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'OWNER',
    label: 'Propietario',
    description: 'Acceso completo a la organización',
  },
  {
    value: 'SUPERINTENDENT',
    label: 'Superintendente',
    description: 'Gestión de proyectos y equipo',
  },
  {
    value: 'RESIDENT',
    label: 'Residente',
    description: 'Gestión de obra diaria',
  },
  {
    value: 'CABO',
    label: 'Cabo',
    description: 'Ejecución de tareas en campo',
  },
];

export function InviteForm({ initialProjects }: { initialProjects?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [projects] = useState<{ id: string; name: string }[]>(initialProjects ?? []);

  // Projects provided by server component via `initialProjects`.

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: undefined,
      project_id: undefined,
    },
  });

  const selectedRole = form.watch('role');
  const showProjectSelect = selectedRole && selectedRole !== 'OWNER';

  async function onSubmit(data: InviteFormValues) {
    setIsSubmitting(true);
    try {
      const result = await inviteMemberAction(data.email, data.role, data.project_id)
      if (!result.success || !result.data) {
        toast.error(result.error || 'Error al enviar la invitación')
        return
      }

      const inviteUrl = `${window.location.origin}/invite/${result.data.invitation_token}`
      setInviteLink(inviteUrl)
      toast.success('Invitación enviada exitosamente')
    } catch {
      toast.error('Error al enviar la invitación');
    } finally {
      setIsSubmitting(false);
    }
  }

  const copyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const sendAnother = () => {
    setInviteLink(null);
    form.reset();
  };

  if (inviteLink) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>¡Invitación enviada!</CardTitle>
          <CardDescription>
            Se ha enviado un correo a {form.getValues('email')} con el enlace de
            invitación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={inviteLink} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            El enlace expira en 7 días
          </p>
          <Separator />
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/team')}>
              Volver al equipo
            </Button>
            <Button className="flex-1" onClick={sendAnother}>
              <UserPlus className="mr-2 h-4 w-4" />
              Enviar otra
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la invitación</CardTitle>
            <CardDescription>
              Envía una invitación para unirse a tu organización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El rol determina los permisos y accesos del usuario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showProjectSelect && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proyecto (opcional)</FormLabel>
                    {projects.length > 0 ? (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Asignar a un proyecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-md border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No hay proyectos activos. Crea un proyecto primero.
                        </p>
                      </div>
                    )}
                    <FormDescription>
                      Opcionalmente asigna al usuario a un proyecto específico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Enviar invitación
          </Button>
        </div>
      </form>
    </Form>
  );
}
