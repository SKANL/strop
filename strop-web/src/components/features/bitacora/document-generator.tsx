'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy, FileText, Download, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { BitacoraEntry } from './log-card';

interface DocumentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: BitacoraEntry[];
  projectName?: string;
  date: Date;
}

export function DocumentGenerator({
  open,
  onOpenChange,
  entries,
  projectName = 'Proyecto sin nombre',
  date,
}: DocumentGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const generateDocument = () => {
    const dateStr = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    
    // Agrupar por tipo de evento
    const bySource = entries.reduce((acc, entry) => {
      if (!acc[entry.source]) acc[entry.source] = [];
      acc[entry.source].push(entry);
      return acc;
    }, {} as Record<string, BitacoraEntry[]>);

    const sourceLabels: Record<string, string> = {
      INCIDENT: 'INCIDENCIAS',
      MANUAL: 'NOTAS DEL RESIDENTE',
      MOBILE: 'EVENTOS DE CAMPO',
      SYSTEM: 'SISTEMA',
    };

    let document = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BITÁCORA ELECTRÓNICA DE OBRA - BORRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROYECTO: ${projectName}
FECHA: ${dateStr}
TOTAL DE EVENTOS: ${entries.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    let eventNumber = 1;

    // Generar contenido por cada tipo de fuente
    Object.entries(bySource).forEach(([source, sourceEntries]) => {
      document += `\n▌ ${sourceLabels[source] || source}\n`;
      document += `${'─'.repeat(60)}\n\n`;

      sourceEntries.forEach((entry) => {
        const time = format(new Date(entry.created_at), 'HH:mm', { locale: es });
        
        document += `${eventNumber}. [${time}] ${entry.title || 'Sin título'}\n`;
        document += `   Responsable: ${entry.user.name}\n`;
        document += `   ${entry.content}\n`;
        
        if (entry.photos && entry.photos > 0) {
          document += `   📷 Evidencia: ${entry.photos} ${entry.photos === 1 ? 'foto' : 'fotos'}\n`;
        }
        
        document += `\n`;
        eventNumber++;
      });
    });

    document += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTA: Este es un borrador. Para generar el documento oficial
con validez legal, utiliza el Compositor BESOP y cierra el día.

Generado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return document;
  };

  const handleCopy = async () => {
    const document = generateDocument();
    try {
      await navigator.clipboard.writeText(document);
      setCopied(true);
      toast.success('Documento copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el documento');
    }
  };

  const handleDownload = () => {
    const document = generateDocument();
    const blob = new Blob([document], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `bitacora-${format(date, 'yyyy-MM-dd')}-borrador.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Documento descargado');
  };

  const documentText = generateDocument();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Borrador de Bitácora
              </SheetTitle>
              <SheetDescription>
                {entries.length} evento{entries.length !== 1 ? 's' : ''} seleccionado{entries.length !== 1 ? 's' : ''}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Preview del documento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vista previa del documento</label>
            <ScrollArea className="h-[500px] rounded-md border">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {documentText}
              </pre>
            </ScrollArea>
          </div>

          <Separator />

          {/* Info y acciones */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Para el documento oficial con validez legal, usa el Compositor BESOP
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={handleCopy} size="sm">
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

