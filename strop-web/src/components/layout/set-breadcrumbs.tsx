"use client";

import { useEffect } from "react";
import { useSetBreadcrumbs } from "./breadcrumbs-context";
import type { BreadcrumbItem } from "@/types";

export default function SetBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const set = useSetBreadcrumbs();

  useEffect(() => {
    set(items);
    return () => set([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  return null;
}
