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

// NOTE: Removed hard-coded default notification preferences (mock data).
// TODO: Load user-specific notification preferences from backend.
// Backend options:
// - Create a `user_settings` table (recommended) with columns: id, user_id, key, value (jsonb)
// - Or store preferences in `users.metadata` JSONB under a `notification_preferences` key.
// Example Supabase fetch (client-side):
// const supabase = createBrowserClient()
// const { data } = await supabase.from('user_settings').select('*').eq('user_id', currentUserId)
// Map results into NotificationSetting[] and call `setSettings(mapped)`
// When saving, prefer a small server-side endpoint or service to enforce RLS/audit.

const defaultSettings: NotificationSetting[] = [];

export function NotificationSettings({
  initialSettings,
}: {
  initialSettings?: NotificationSetting[];
}) {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings ?? defaultSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: On mount, fetch user's saved preferences from backend and call setSettings()
  // Example server-side guidance:
  // 1) If using `user_settings` table: SELECT key,value WHERE user_id = currentUserId
  // 2) If using users.metadata: SELECT metadata->'notification_preferences' FROM users WHERE id = currentUserId
  // 3) Map the stored structure into NotificationSetting[] and setSettings(mapped)

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
