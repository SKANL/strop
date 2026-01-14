"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function humanize(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function titleForSegment(seg: string, next?: string) {
  if (!seg) return '';
  const map: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Proyectos',
    incidents: 'Incidencias',
    team: 'Equipo',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    organization: 'Organización',
    invite: 'Invitar miembro',
    new: next === undefined ? 'Nuevo' : 'Nuevo',
    edit: 'Editar',
  };

  if (map[seg]) return map[seg];

  // detect id-like segments (uuid/ids)
  if (/^[0-9a-fA-F-]{6,}$/.test(seg)) {
    if (next === 'edit') return 'Editar';
    return 'Detalle';
  }

  return humanize(seg);
}

export function HeaderBreadcrumbs() {
  const pathname = usePathname() ?? '/dashboard';
  const parts = pathname.split('/').filter(Boolean);

  // Always start with Dashboard
  const items: { title: string; url?: string }[] = [
    { title: 'Dashboard', url: '/dashboard' },
  ];

  let acc = '';
  parts.forEach((seg, idx) => {
    acc += `/${seg}`;
    const next = parts[idx + 1];
    const title = titleForSegment(seg, next);
    items.push({ title, url: acc });
  });

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={`${item.title}-${index}`}>
              <BreadcrumbItem className={isLast ? '' : 'hidden md:block'}>
                {isLast || !item.url ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default HeaderBreadcrumbs;
