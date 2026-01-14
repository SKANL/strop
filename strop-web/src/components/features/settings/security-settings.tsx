'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Shield, Smartphone, Key } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared';
import { updatePasswordAction, signOutAllAction } from '@/app/actions/settings.actions';

const passwordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
    new_password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function SecuritySettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updatePasswordAction(data.new_password);

      if (!result.success) {
        toast.error(result.error || 'Error al cambiar la contraseña');
        return;
      }

      toast.success('Contraseña actualizada');
      form.reset();
    } catch {
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleLogoutAll = async () => {
    try {
      const result = await signOutAllAction();
      if (!result.success) {
        toast.error(result.error || 'Error al cerrar sesiones');
        return;
      }

      toast.success('Se cerró sesión en todos los dispositivos');
      setShowLogoutConfirm(false);
      window.location.href = '/login';
    } catch {
      toast.error('Error al cerrar sesiones');
    }
  };

  // Note: Supabase doesn't provide a way to list active sessions in the client API
  // This would require a custom implementation with session tracking in the database
  const currentSession = {
    id: '1',
    device: 'Sesión actual',
    location: 'Dispositivo actual',
    lastActive: 'Ahora',
    current: true,
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Seguridad</h3>
          <p className="text-sm text-muted-foreground">
            Administra tu contraseña y sesiones activas
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cambiar contraseña
                </CardTitle>
                <CardDescription>
                  Asegúrate de usar una contraseña segura que no uses en otros sitios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña actual</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Mínimo 8 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </Form>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Sesiones activas
                </CardTitle>
                <CardDescription>
                  Dispositivos donde tienes sesión iniciada
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Cerrar todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{currentSession.device}</p>
                      <Badge variant="secondary">Esta sesión</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentSession.location} · {currentSession.lastActive}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: El seguimiento detallado de sesiones requiere configuración adicional en el servidor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="¿Cerrar todas las sesiones?"
        description="Se cerrará sesión en todos los dispositivos excepto este. Tendrás que volver a iniciar sesión en esos dispositivos."
        confirmLabel="Cerrar todas"
        variant="destructive"
        onConfirm={handleLogoutAll}
      />
    </>
  );
}
