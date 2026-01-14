import type { Metadata } from 'next';
import Link from 'next/link';
import { User, Building2, Bell, Shield, Palette } from 'lucide-react';

// Breadcrumb rendered in header now

export const metadata: Metadata = {
  title: {
    template: '%s | Configuración - Strop',
    default: 'Configuración',
  },
};

const settingsNav = [
  {
    title: 'Perfil',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Organización',
    href: '/settings/organization',
    icon: Building2,
  },
  {
    title: 'Notificaciones',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Apariencia',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Seguridad',
    href: '/settings/security',
    icon: Shield,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Breadcrumb removed from settings layout — header now renders it */}
        </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias de la organización.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Sidebar Navigation */}
        <SettingsNav />

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SettingsNav() {
  // Note: This is a server component, so we use CSS to highlight active state
  // The active state will be handled by each page or via client component
  return (
    <aside className="flex flex-col gap-1">
      {settingsNav.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </aside>
  );
}
