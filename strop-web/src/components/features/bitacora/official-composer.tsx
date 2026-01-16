'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Loader2,
  Copy,
  Lock,
  FileText,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { BitacoraEntry } from './log-card';

const closureSchema = z.object({
  official_content: z
    .string()
    .min(50, 'El contenido oficial debe tener al menos 50 caracteres')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
  pin: z
    .string()
    .regex(/^\d{4}$/, 'El PIN debe ser de 4 dígitos')
    .optional()
    .or(z.literal('')),
});

type ClosureFormValues = z.infer<typeof closureSchema>;

interface OfficialComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: BitacoraEntry[];
  projectName: string;
  date: Date;
  onClosureSuccess?: (data: { official_content: string; pin?: string }) => Promise<void>;
}

export function OfficialComposer({
  open,
  onOpenChange,
  entries,
  projectName,
  date,
  onClosureSuccess,
}: OfficialComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const form = useForm<ClosureFormValues>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      official_content: '',
      pin: '',
    },
  });

  // Generar contenido BESOP cuando cambian las entradas
  useEffect(() => {
    if (entries.length > 0) {
      const content = generateBESOPContent(entries, projectName, date);
      setGeneratedContent(content);
      form.setValue('official_content', content);
    }
  }, [entries, projectName, date, form]);

  async function onSubmit(data: ClosureFormValues) {
    setIsSubmitting(true);
    try {
      await onClosureSuccess?.({
        official_content: data.official_content,
        pin: data.pin || undefined,
      });
      
      // Success notification and navigation handled by parent
      form.reset();
    } catch (error) {
      toast.error('Error al cerrar el día', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast.success('Contenido copiado al portapapeles');
    } catch {
      toast.error('Error al copiar el contenido');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compositor BESOP - Documento Oficial
          </SheetTitle>
          <SheetDescription>
            Bitácora Electrónica de Seguimiento de Obra Pública
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Información del documento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Proyecto:</span>
              <span className="font-medium">{projectName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">
                {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Eventos incluidos:</span>
              <Badge variant="secondary">{entries.length}</Badge>
            </div>
          </div>

          <Separator />

          {/* Alerta de inmutabilidad */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Documento con validez legal</AlertTitle>
            <AlertDescription>
              Una vez cerrado el día, este documento será <strong>inmutable</strong> y tendrá validez legal.
              Verifica que toda la información sea correcta antes de confirmar.
            </AlertDescription>
          </Alert>

          {/* Formulario */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="official_content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Contenido oficial BESOP</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyContent}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="El contenido se generará automáticamente..."
                      />
                    </FormControl>
                    <FormDescription>
                      Puedes editar el contenido antes de cerrar el día
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN de autorización (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        maxLength={4}
                        placeholder="4 dígitos"
                        className="max-w-[200px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Protege el cierre con un PIN de 4 dígitos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || entries.length === 0}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cerrando día...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Cerrar día oficialmente
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Función para generar contenido BESOP con formato legal
function generateBESOPContent(
  entries: BitacoraEntry[],
  projectName: string,
  date: Date
): string {
  const dateStr = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Agrupar por tipo de evento
  const bySource = entries.reduce((acc, entry) => {
    if (!acc[entry.source]) acc[entry.source] = [];
    acc[entry.source].push(entry);
    return acc;
  }, {} as Record<string, BitacoraEntry[]>);

  const sourceLabels: Record<string, string> = {
    INCIDENT: 'INCIDENCIAS REPORTADAS',
    MANUAL: 'NOTAS DEL RESIDENTE',
    MOBILE: 'EVENTOS DE CAMPO',
    SYSTEM: 'REGISTROS DEL SISTEMA',
  };

  let content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BITÁCORA ELECTRÓNICA DE SEGUIMIENTO DE OBRA PÚBLICA
(BESOP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROYECTO: ${projectName}
FECHA: ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONSTE QUE DURANTE EL DÍA DE LA FECHA SE REGISTRARON
LOS SIGUIENTES EVENTOS EN OBRA:

`;

  let eventNumber = 1;
  
  // Generar contenido por cada tipo de fuente
  Object.entries(bySource).forEach(([source, sourceEntries]) => {
    content += `\n${sourceLabels[source] || source}\n`;
    content += `${'─'.repeat(60)}\n\n`;

    sourceEntries.forEach((entry) => {
      const time = format(new Date(entry.created_at), 'HH:mm', { locale: es });
      
      content += `${eventNumber}. [${time}] ${entry.title || 'Sin título'}\n`;
      content += `   Registrado por: ${entry.user.name}\n`;
      content += `   ${entry.content}\n`;
      
      if (entry.photos && entry.photos > 0) {
        content += `   📷 Evidencia fotográfica: ${entry.photos} ${entry.photos === 1 ? 'foto' : 'fotos'}\n`;
      }
      
      content += `\n`;
      eventNumber++;
    });
  });

  content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL DE EVENTOS REGISTRADOS: ${entries.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADVERTENCIA LEGAL:
Este documento ha sido generado electrónicamente y tiene
validez legal conforme a la normativa vigente. Una vez
cerrado, el contenido es INMUTABLE y forma parte del
expediente oficial de la obra.

Fecha y hora de cierre: ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return content;
}

