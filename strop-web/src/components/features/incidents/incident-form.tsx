'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextImage from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getOrganizationProjectsAction } from '@/app/actions/team.actions';
import { createIncidentAction } from '@/app/actions/incidents.actions';
import { uploadPhotoAction } from '@/app/actions/storage.actions';
import type { IncidentType } from '@/types';

const incidentFormSchema = z.object({
  project_id: z.string().min(1, 'Selecciona un proyecto'),
  type: z.enum(['ORDER_INSTRUCTION', 'REQUEST_QUERY', 'CERTIFICATION', 'INCIDENT_NOTIFICATION'], {
    message: 'Selecciona un tipo de incidencia',
  }),
  priority: z.enum(['NORMAL', 'CRITICAL'], {
    message: 'Selecciona la prioridad',
  }),
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  location_description: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

const incidentTypes: { value: IncidentType; label: string; description: string }[] = [
  { value: 'ORDER_INSTRUCTION', label: 'Orden/Instrucción', description: 'Órdenes o instrucciones de trabajo' },
  { value: 'REQUEST_QUERY', label: 'Solicitud/Consulta', description: 'Solicitudes de información o consultas' },
  { value: 'CERTIFICATION', label: 'Certificación', description: 'Certificación de avances o trabajos' },
  { value: 'INCIDENT_NOTIFICATION', label: 'Notificación', description: 'Notificación de incidentes en obra' },
];

export function IncidentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get('project');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const res = await getOrganizationProjectsAction();
      if (res.success && res.data) {
        setProjects(res.data || []);
      } else {
        setProjects([]);
      }
      setLoading(false);
    }
    
    fetchProjects();
  }, []);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      project_id: preselectedProject ?? '',
      type: undefined,
      priority: 'NORMAL',
      title: '',
      description: '',
      location_description: '',
    },
  });

  async function onSubmit(data: IncidentFormValues) {
    setIsSubmitting(true);
    try {
      // Build form data for the server action
      const fd = new FormData();
      fd.append('title', data.title);
      fd.append('description', data.description);
      fd.append('type', data.type);
      fd.append('priority', data.priority);
      if (data.location_description) fd.append('location', data.location_description);

      const res = await createIncidentAction(data.project_id, fd);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to create incident');

      const incidentId = res.data.id;
      const organizationId = res.data.organization_id;

      // Upload photos if any
      if (photos.length > 0) {
        const uploadedCount = await Promise.all(
          photos.map(async (file) => {
            const result = await uploadPhotoAction(incidentId, organizationId, data.project_id, file);
            return result.success ? 1 : 0;
          })
        );

        const successCount = uploadedCount.reduce<number>((a, b) => a + b, 0);
        if (successCount < photos.length) {
          toast.warning(`${successCount}/${photos.length} fotos subidas correctamente`);
        } else {
          toast.success(`${successCount} fotos subidas exitosamente`);
        }
      }

      toast.success('Incidencia creada exitosamente');
      router.push('/incidents');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la incidencia';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).slice(0, 5 - photos.length);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información de la incidencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proyecto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción breve del problema" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de incidencia</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {incidentTypes.map((type) => (
                        <div key={type.value}>
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground text-center">
                              {type.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NORMAL" id="normal" />
                        <Label htmlFor="normal">Normal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CRITICAL" id="critical" />
                        <Label htmlFor="critical" className="text-destructive">
                          <AlertTriangle className="mr-1 h-4 w-4 inline" />
                          Crítica
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Las incidencias críticas generan alertas inmediatas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción detallada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el problema en detalle..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Piso 5, Área de baños" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidencia fotográfica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {photos.map((photo, index) => {
                const objectUrl = URL.createObjectURL(photo);
                return (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg border bg-muted overflow-hidden"
                  >
                    <NextImage
                      src={objectUrl}
                      alt={`Foto ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="20vw"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {photos.length < 5 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-xs text-muted-foreground">Agregar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
            <p className="text-sm text-muted-foreground">
              Puedes agregar hasta 5 fotos como evidencia
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear incidencia
          </Button>
        </div>
      </form>
    </Form>
  );
}
