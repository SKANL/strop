'use server';

import { createServerActionClient } from '@/lib/supabase/server';
import { createUsersService } from '@/lib/services';

interface UpdateProfileInput {
  full_name?: string;
  profile_picture_url?: string;
}

export async function updateUserProfileAction(
  userId: string,
  updates: UpdateProfileInput
) {
  try {
    const supabase = await createServerActionClient();
    const usersService = createUsersService(supabase);

    const { data, error } = await usersService.updateProfile(userId, updates);

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al actualizar el perfil',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[updateUserProfileAction]', error);
    return {
      success: false,
      error: 'Error al actualizar el perfil',
    };
  }
}

export async function setCurrentOrganizationAction(
  userId: string,
  organizationId: string
) {
  try {
    const supabase = await createServerActionClient();
    const usersService = createUsersService(supabase);

    const { data, error } = await usersService.setCurrentOrganization(
      userId,
      organizationId
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al cambiar la organización',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[setCurrentOrganizationAction]', error);
    return {
      success: false,
      error: 'Error al cambiar la organización',
    };
  }
}

export async function setThemeModeAction(
  userId: string,
  mode: 'light' | 'dark'
) {
  try {
    const supabase = await createServerActionClient();
    const usersService = createUsersService(supabase);

    const { data, error } = await usersService.setThemeMode(userId, mode);

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al cambiar el tema',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[setThemeModeAction]', error);
    return {
      success: false,
      error: 'Error al cambiar el tema',
    };
  }
}
