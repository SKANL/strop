'use server';

import { createServerActionClient } from '@/lib/supabase/server';
import { createOrganizationsService, createStorageService } from '@/lib/services';
import type { TablesUpdate } from '@/types/supabase';

export async function updateOrganizationAction(
  organizationId: string,
  updates: TablesUpdate<'organizations'>
) {
  try {
    const supabase = await createServerActionClient();
    const organizationsService = createOrganizationsService(supabase);

    const { data, error } = await organizationsService.updateOrganization(
      organizationId,
      updates
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al actualizar la organización',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[updateOrganizationAction]', error);
    return {
      success: false,
      error: 'Error al actualizar la organización',
    };
  }
}

export async function uploadOrganizationLogoAction(
  organizationId: string,
  file: File
) {
  try {
    const supabase = await createServerActionClient();
    const storageService = createStorageService(supabase);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${organizationId}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { data: uploadedFile, error } = await storageService.uploadFile(
      'org-logos',
      filePath,
      file,
      { upsert: true }
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al subir el logo',
      };
    }

    // Update organization with logo URL
    const organizationsService = createOrganizationsService(supabase);
    const { data, error: updateError } = await organizationsService.updateOrganization(
      organizationId,
      { logo_url: uploadedFile?.url }
    );

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'Error al guardar el logo',
      };
    }

    return {
      success: true,
      data: { logo_url: uploadedFile?.url },
    };
  } catch (error) {
    console.error('[uploadOrganizationLogoAction]', error);
    return {
      success: false,
      error: 'Error al subir el logo',
    };
  }
}
