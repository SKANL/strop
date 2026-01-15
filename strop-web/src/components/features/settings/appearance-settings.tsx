'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const themes = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Tema con fondo claro',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Oscuro',
    description: 'Tema con fondo oscuro',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Usa la preferencia del sistema',
    icon: Monitor,
  },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Apariencia</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza la apariencia de la aplicación
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>
              Selecciona el tema de la interfaz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {themes.map((t) => (
                <div
                  key={t.value}
                  className="flex items-center gap-3 rounded-lg border p-4 opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <t.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Label className="font-medium">{t.label}</Label>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apariencia</h3>
        <p className="text-sm text-muted-foreground">
          Personaliza la apariencia de la aplicación
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>
            Selecciona el tema de la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((t) => {
              const isSelected = theme === t.value;
              const Icon = t.icon;
              
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected && 'border-primary bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="font-medium cursor-pointer">{t.label}</Label>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
