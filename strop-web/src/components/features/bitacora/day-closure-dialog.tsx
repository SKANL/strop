'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, Loader2, FileText, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const closureSchema = z.object({
  official_content: z
    .string()
    .min(50, 'El contenido oficial debe tener al menos 50 caracteres')
    .max(5000, 'El contenido oficial no puede exceder 5000 caracteres'),
  pin: z
    .string()
    .min(4, 'El PIN debe tener al menos 4 dígitos')
    .max(6, 'El PIN no puede exceder 6 dígitos')
    .regex(/^\d+$/, 'El PIN solo puede contener números')
    .optional()
    .or(z.literal('')),
});

type ClosureFormValues = z.infer<typeof closureSchema>;

interface DayClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  projectName: string;
  generatedContent: string;
  onConfirm?: (data: { official_content: string; pin?: string }) => Promise<void>;
}

export function DayClosureDialog({
  open,
  onOpenChange,
  date,
  projectName,
  generatedContent,
  onConfirm,
}: DayClosureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClosureFormValues>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      official_content: generatedContent,
      pin: '',
    },
  });

  async function onSubmit(data: ClosureFormValues) {
    setIsSubmitting(true);
    try {
      await onConfirm?.({
        official_content: data.official_content,
        pin: data.pin || undefined,
      });
      
      toast.success('Día cerrado exitosamente', {
        description: 'El contenido es ahora inmutable',
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Error al cerrar el día', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Cerrar Día Oficialmente</DialogTitle>
              <DialogDescription>
                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} - {projectName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Una vez cerrado el día, el contenido será inmutable y no
            podrá modificarse. Esta acción tiene validez legal para cumplimiento normativo.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4 pr-4">
                <FormField
                  control={form.control}
                  name="official_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contenido Oficial de Cierre
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[300px] font-mono text-xs resize-none"
                          placeholder="Contenido oficial generado de la bitácora..."
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes editar el contenido antes de confirmar el cierre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        PIN de Seguridad (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Ingresa un PIN de 4-6 dígitos"
                          className="max-w-xs"
                        />
                      </FormControl>
                      <FormDescription>
                        PIN opcional para protección adicional del cierre del día
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cerrando día...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Confirmar Cierre
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
