'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { createUsersService, createStorageService } from '@/lib/services';
import { updateUserProfileAction } from '@/app/actions/storage.actions';

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileSettings({
  initialData,
}: {
  initialData?: { id: string; full_name: string; email: string; avatar_url: string | null };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
    },
  });
  
  useEffect(() => {
    if (initialData) {
      setCurrentUser({
        id: initialData.id,
        full_name: initialData.full_name,
        email: initialData.email,
        avatar_url: initialData.avatar_url,
      });

      form.reset({
        full_name: initialData.full_name,
        email: initialData.email,
      });

      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const supabase = createBrowserClient();
        const usersService = createUsersService(supabase);

        const { data: profile, error } = await usersService.getCurrentUserProfile();

        if (error) {
          toast.error('Error al cargar el perfil');
          return;
        }

        if (profile) {
          const userData = {
            id: profile.id,
            full_name: profile.full_name ?? '',
            email: profile.email,
            avatar_url: profile.profile_picture_url,
          };

          setCurrentUser(userData);

          form.reset({
            full_name: userData.full_name,
            email: userData.email,
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [form, initialData]);

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
    : 'U';

  async function onSubmit(data: ProfileFormValues) {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateUserProfileAction(currentUser.id, {
        full_name: data.full_name,
      });
      
      if (!result.success) {
        toast.error(result.error || 'Error al actualizar el perfil');
        return;
      }

      toast.success('Perfil actualizado');
      setCurrentUser(prev => 
        prev ? { 
          ...prev, 
          full_name: data.full_name, 
        } : null
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se aceptan imágenes JPG, PNG o WebP');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const supabase = createBrowserClient();
      const storageService = createStorageService(supabase);
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${currentUser.id}-${timestamp}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;
      
      // Upload to avatars bucket
      const { data: uploadedFile, error } = await storageService.uploadFile(
        'avatars',
        filePath,
        file,
        { upsert: false }
      );

      if (error || !uploadedFile) {
        toast.error(error?.message || 'Error al subir la imagen');
        return;
      }

      // Update user profile with new avatar URL
      const result = await updateUserProfileAction(currentUser.id, {
        profile_picture_url: uploadedFile.url,
      });

      if (!result.success) {
        toast.error('Error al actualizar la foto de perfil');
        return;
      }

      toast.success('Foto de perfil actualizada');
      setCurrentUser(prev => 
        prev ? { ...prev, avatar_url: uploadedFile.url } : null
      );
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploadingAvatar(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Perfil</h3>
          <p className="text-sm text-muted-foreground">
            Administra tu información personal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
            <CardDescription>
              Haz clic en la imagen para cambiar tu foto
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentUser?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label 
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="sr-only" 
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser?.full_name}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
                <CardDescription>
                  Actualiza tu información de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Este es el correo que usas para iniciar sesión
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
