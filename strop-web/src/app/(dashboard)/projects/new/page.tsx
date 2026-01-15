import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
// Breadcrumb rendered in header now
import { ProjectForm } from '@/components/features/projects';

export const metadata: Metadata = {
  title: 'Nuevo proyecto',
};

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb removed from page — header now renders it */}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo proyecto</h1>
          <p className="text-muted-foreground">
            Completa la información para crear un nuevo proyecto
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
