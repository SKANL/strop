import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Breadcrumb rendered in header now
import { Button } from '@/components/ui/button';
import { IncidentForm } from '@/components/features/incidents';

export default function NewIncidentPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb removed from page — header now renders it */}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/incidents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva incidencia</h1>
          <p className="text-muted-foreground">
            Reporta un problema o incidencia en la obra
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div>Cargando...</div>}>
          <IncidentForm />
        </Suspense>
      </div>
    </div>
  );
}
