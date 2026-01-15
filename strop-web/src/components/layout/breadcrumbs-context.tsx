"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { BreadcrumbItem } from "@/types";

type ContextValue = {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (b: BreadcrumbItem[] | ((prev: BreadcrumbItem[]) => BreadcrumbItem[])) => void;
};

const BreadcrumbsContext = createContext<ContextValue | undefined>(undefined);

export function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const value = useMemo(() => ({ breadcrumbs, setBreadcrumbs }), [breadcrumbs]);

  return (
    <BreadcrumbsContext.Provider value={value}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbs() {
  const ctx = useContext(BreadcrumbsContext);
  return ctx?.breadcrumbs ?? [];
}

export function useSetBreadcrumbs() {
  const ctx = useContext(BreadcrumbsContext);
  return ctx?.setBreadcrumbs ?? (() => {});
}

export default BreadcrumbsProvider;
