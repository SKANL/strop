'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { saveNotificationSettingsAction } from '@/app/actions/settings.actions';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export function NotificationSettings({
  initialSettings,
}: {
  initialSettings?: NotificationSetting[];
}) {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSetting = (id: string, type: 'email' | 'push') => {
    setSettings(
      settings.map((s) =>
        s.id === id ? { ...s, [type]: !s[type] } : s
      )
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await saveNotificationSettingsAction(settings as any[]);

      if (!result.success) {
        toast.error(result.error || 'Error al guardar las preferencias');
        return;
      }

      toast.success('Preferencias de notificación guardadas');
    } catch {
      toast.error('Error al guardar las preferencias');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notificaciones</h3>
          <p className="text-sm text-muted-foreground">
            Configura cómo y cuándo quieres recibir notificaciones
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias de notificación</CardTitle>
            <CardDescription>
              Elige qué notificaciones quieres recibir por email o push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-[1fr_80px_80px] gap-4 items-center text-sm font-medium text-muted-foreground">
              <div>Tipo de notificación</div>
              <div className="text-center">Email</div>
              <div className="text-center">Push</div>
            </div>
            <Separator />
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="grid grid-cols-[1fr_80px_80px] gap-4 items-center"
              >
                <div>
                  <Label htmlFor={setting.id} className="font-medium">
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={setting.email}
                    onCheckedChange={() => toggleSetting(setting.id, 'email')}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={setting.push}
                    onCheckedChange={() => toggleSetting(setting.id, 'push')}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar preferencias
          </Button>
        </div>
      </div>
  );
}
