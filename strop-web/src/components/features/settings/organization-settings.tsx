'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase/client';
import { createOrganizationsService, createUsersService } from '@/lib/services';
import { updateOrganizationAction, uploadOrganizationLogoAction } from '@/app/actions/organizations.actions';

const organizationFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
  billing_email: z.string().email('Ingresa un correo válido').optional().or(z.literal('')),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export function OrganizationSettings({
  initialData,
}: {
  initialData?: { id: string; name: string; slug: string; billing_email?: string | null; logo_url?: string | null };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentOrg, setCurrentOrg] = useState<{
    id: string;
    name: string;
    slug: string;
    billing_email: string | null;
    logo_url: string | null;
  } | null>(null);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      billing_email: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setCurrentOrg({
        id: initialData.id,
        name: initialData.name,
        slug: initialData.slug,
        billing_email: initialData.billing_email || null,
        logo_url: initialData.logo_url || null,
      });

      form.reset({
        name: initialData.name,
        slug: initialData.slug,
        billing_email: initialData.billing_email || '',
      });

      setLoading(false);
      return;
    }

    async function fetchOrganization() {
      try {
        const supabase = createBrowserClient();
        const usersService = createUsersService(supabase);

        // Get current user's profile with org info
        const { data: userProfile, error } = await usersService.getCurrentUserProfile();

        if (error || !userProfile?.current_organization_id) {
          toast.error('Error al cargar la organización');
          return;
        }

        const organizationsService = createOrganizationsService(supabase);
        const { data: org, error: orgError } = await organizationsService.getOrganizationWithMembers(
          userProfile.current_organization_id
        );

        if (orgError || !org) {
          toast.error('Organización no encontrada');
          return;
        }

        setCurrentOrg({
          id: org.id,
          name: org.name,
          slug: org.slug,
          billing_email: org.billing_email || null,
          logo_url: org.logo_url,
        });

        form.reset({
          name: org.name,
          slug: org.slug,
          billing_email: org.billing_email || '',
        });
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast.error('Error al cargar la organización');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [form, initialData]);

  async function onSubmit(data: OrganizationFormValues) {
    if (!currentOrg) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateOrganizationAction(currentOrg.id, {
        name: data.name,
        slug: data.slug,
        billing_email: data.billing_email || null,
      });
      
      if (!result.success) {
        toast.error(result.error || 'Error al actualizar la organización');
        return;
      }

      toast.success('Organización actualizada');
      setCurrentOrg(prev => prev ? { 
        ...prev, 
        name: data.name,
        slug: data.slug,
        billing_email: data.billing_email || null,
      } : null);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Error al actualizar la organización');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentOrg) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Solo se aceptan imágenes JPG, PNG, WebP o SVG');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const result = await uploadOrganizationLogoAction(currentOrg.id, file);

      if (!result.success) {
        toast.error(result.error || 'Error al subir el logo');
        return;
      }

      toast.success('Logo actualizado');
      setCurrentOrg(prev => 
        prev ? { ...prev, logo_url: result.data?.logo_url || null } : null
      );
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No perteneces a ninguna organización</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organización</h3>
          <p className="text-sm text-muted-foreground">
            Administra la información de tu empresa
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logo de la empresa</CardTitle>
            <CardDescription>
              El logo aparecerá en reportes y documentos oficiales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 disabled:opacity-50">
              {currentOrg.logo_url ? (
                <div className="relative h-full w-full p-2">
                  <NextImage
                    src={currentOrg.logo_url}
                    alt="Logo"
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                </div>
              ) : (
                <>
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                  <span className="mt-2 text-xs text-muted-foreground">
                    Subir logo
                  </span>
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="sr-only" 
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
              />
            </label>
            {isUploadingLogo && (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Subiendo...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la empresa</CardTitle>
                <CardDescription>
                  Detalles básicos de tu organización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la empresa</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Identificador único (sin espacios)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billing_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de facturación</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="billing@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email para recibir facturas y notificaciones
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </div>
  );
}
