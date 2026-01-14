'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { closeIncidentAction } from '@/app/actions/incidents.actions';

interface IncidentCloseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
}

export function IncidentClose({ open, onOpenChange, incidentId }: IncidentCloseProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      const res = await closeIncidentAction(incidentId, undefined, notes);
      if (!res.success) {
        toast.error(res.error || 'Error al cerrar la incidencia');
        return;
      }

      toast.success('Incidencia cerrada exitosamente');
      onOpenChange(false);
    } catch {
      toast.error('Error al cerrar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar incidencia</DialogTitle>
          <DialogDescription>
            Confirma que la incidencia ha sido resuelta. Puedes agregar notas de
            resolución opcionales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de resolución (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe cómo se resolvió la incidencia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
