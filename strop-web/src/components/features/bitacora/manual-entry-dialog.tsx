'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, FileEdit } from 'lucide-react';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { createManualEntryAction } from '@/app/actions/bitacora.actions';

const manualEntrySchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres'),
  content: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(2000, 'El contenido no puede exceder 2000 caracteres'),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  date: Date;
}

export function ManualEntryDialog({
  open,
  onOpenChange,
  projectId,
  date,
}: ManualEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  async function onSubmit(data: ManualEntryFormValues) {
    setIsSubmitting(true);
    try {
      const dateParam = format(date, 'yyyy-MM-dd')
      const res = await createManualEntryAction(projectId, dateParam, data.title, data.content)
      if (!res.success) {
        toast.error(res.error || 'Error al guardar la entrada')
        return
      }

      toast.success('Entrada manual registrada', {
        description: 'La nota se ha agregado al timeline del día',
      })

      form.reset()
      onOpenChange(false)
    } catch {
      toast.error('Error al registrar la entrada');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Nueva entrada manual
          </DialogTitle>
          <DialogDescription>
            Agrega una nota al registro del día {format(date, "d 'de' MMMM", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Avance de obra en área norte"
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>
                    Un título descriptivo para identificar esta entrada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe lo que ocurrió durante el día..."
                      className="min-h-[150px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Detalla los eventos, actividades o notas relevantes del día
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar entrada'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
