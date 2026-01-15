'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import HeaderBreadcrumbs from '@/components/layout/header-breadcrumbs';
import { useBreadcrumbs } from '@/components/layout/breadcrumbs-context';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import React from 'react';

interface SiteHeaderProps {
  breadcrumbs?: BreadcrumbItemType[];
}

export function SiteHeader({ breadcrumbs = [] }: SiteHeaderProps) {
  const ctxBreadcrumbs = useBreadcrumbs();
  const effective = (breadcrumbs.length > 0 ? breadcrumbs : ctxBreadcrumbs) ?? [];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/* Prefer explicit breadcrumbs prop, fall back to page-provided context, then header-driven fallback */}
        {effective.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {effective.map((item, index) => {
                const isLast = index === effective.length - 1;

                return (
                  <React.Fragment key={item.title}>
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
        ) : (
          <HeaderBreadcrumbs />
        )}
      </div>
    </header>
  );
}
