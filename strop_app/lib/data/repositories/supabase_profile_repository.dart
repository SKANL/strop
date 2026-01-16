import 'package:strop_app/core/utils/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:strop_app/data/models/user_model.dart';
import 'package:strop_app/domain/entities/user.dart' as domain;
import 'package:strop_app/domain/repositories/profile_repository.dart';

class SupabaseProfileRepository implements ProfileRepository {
  final SupabaseClient _supabase;
  // Use global logger instance from core/utils/logger.dart

  SupabaseProfileRepository(this._supabase);

  // Simple retry helper for transient errors
  Future<T> _retry<T>(Future<T> Function() fn, {int attempts = 3}) async {
    var attempt = 0;
    while (true) {
      attempt++;
      try {
        return await fn();
      } catch (e) {
        final isLast = attempt >= attempts;
        if (!_isTransientError(e) || isLast) rethrow;
        final delayMs = 300 * (1 << (attempt - 1));
        logger.w(
          'Transient error, retrying in ${delayMs}ms (attempt $attempt) - $e',
        );
        await Future<void>.delayed(Duration(milliseconds: delayMs));
      }
    }
  }

  bool _isTransientError(Object e) {
    final msg = e.toString().toLowerCase();
    if (e is PostgrestException)
      return false; // DB errors usually not transient
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('timeout'))
      return true;
    return false;
  }

  @override
  Future<domain.User?> getMyProfile(String userId) async {
    try {
      // Try to find user by auth_id (auth user id) or by users.id
      final response = await _retry(() async {
        return await _supabase
            .from('users')
            .select(
              'id, email, full_name, auth_id, current_organization_id, profile_picture_url, is_active, theme_mode, created_at, updated_at',
            )
            .or('auth_id.eq.$userId,id.eq.$userId')
            .maybeSingle();
      });

      if (response == null) return null;

      return UserModel.fromJson(response as Map<String, dynamic>);
    } on PostgrestException catch (e) {
      logger.e('DB error getting profile: ${e.message}');
      final msg = e.message.toString();
      if (msg.toLowerCase().contains('permission') ||
          msg.toLowerCase().contains('policy')) {
        throw Exception('Permisos insuficientes para leer el perfil.');
      }
      throw Exception('Error al obtener perfil: $msg');
    } catch (e) {
      logger.e('Unexpected error getting profile', error: e);
      if (e.toString().toLowerCase().contains('socketexception') ||
          e.toString().toLowerCase().contains('failed host lookup')) {
        throw Exception(
          'Sin conexión. Verifica tu internet e intenta nuevamente.',
        );
      }
      rethrow;
    }
  }

  @override
  Future<void> updateProfile(domain.User profile) async {
    try {
      final updateData = {
        'full_name': profile.fullName,
        'profile_picture_url': profile.profilePictureUrl,
        'theme_mode': profile.themeMode,
        'current_organization_id': profile.currentOrganizationId,
      };

      // Update by internal id first
      await _retry(() async {
        return await _supabase
            .from('users')
            .update(updateData)
            .eq('id', profile.id);
      });

      // Verify the update affected a row; if not, try updating by auth_id as a fallback
      final verifyById = await _supabase
          .from('users')
          .select('id')
          .eq('id', profile.id)
          .maybeSingle();

      if (verifyById == null) {
        final authTarget = profile.authId ?? profile.id;
        logger.w(
          'Update by id affected 0 rows; retrying update by auth_id=$authTarget',
        );
        await _retry(() async {
          return await _supabase
              .from('users')
              .update(updateData)
              .eq('auth_id', authTarget);
        });

        final verifyByAuth = await _supabase
            .from('users')
            .select('id')
            .eq('auth_id', authTarget)
            .maybeSingle();
        if (verifyByAuth == null) {
          logger.e('Profile update failed: no rows matched by id or auth_id');
          throw Exception(
            'No se pudo actualizar el perfil. Intenta nuevamente.',
          );
        }
      }

      // Attempt to keep Supabase Auth user metadata in sync only when the
      // current session corresponds to the updated user.
      final currentAuthId = _supabase.auth.currentUser?.id;
      final authTargetId = profile.authId ?? profile.id;
      if (currentAuthId != null && currentAuthId == authTargetId) {
        try {
          await _supabase.auth.updateUser(
            UserAttributes(
              data: {
                'full_name': profile.fullName,
                'avatar_url': profile.profilePictureUrl,
              },
            ),
          );
        } on AuthException catch (e) {
          logger.w('Auth metadata sync failed', error: e);
        } catch (e) {
          logger.w('Auth metadata sync unexpected error', error: e);
        }
      } else {
        logger.i(
          'Skipping auth metadata sync: session user differs from profile',
        );
      }
    } on PostgrestException catch (e) {
      logger.e('DB error updating profile: ${e.message}');
      final msg = e.message.toString();
      if (msg.toLowerCase().contains('duplicate') ||
          msg.toLowerCase().contains('unique')) {
        throw Exception(
          'Ya existe un usuario con este correo en esta organización.',
        );
      }
      if (msg.toLowerCase().contains('violates check constraint')) {
        throw Exception(
          'Los datos proporcionados no cumplen las reglas del sistema.',
        );
      }
      throw Exception('Error al actualizar perfil: $msg');
    } catch (e) {
      logger.e('Unexpected error updating profile', error: e);
      if (e.toString().toLowerCase().contains('socketexception')) {
        throw Exception(
          'Sin conexión. Verifica tu internet e intenta nuevamente.',
        );
      }
      rethrow;
    }
  }

  @override
  Future<void> changePassword(String newPassword) async {
    try {
      // Ensure there is a current session
      final current = _supabase.auth.currentUser;
      if (current == null) {
        throw Exception('Sesión inválida. Vuelve a iniciar sesión.');
      }

      // Using Supabase Auth SDK to update the user's password
      await _supabase.auth.updateUser(UserAttributes(password: newPassword));
    } on AuthException catch (e) {
      logger.e('Auth error changing password', error: e);
      // Map common messages to friendly UX strings
      final msg =
          e.message?.toString() ??
          'Error de autenticación al cambiar contraseña.';
      if (msg.contains('JWT')) {
        throw Exception(
          'Sesión expiró. Vuelve a iniciar sesión e intenta de nuevo.',
        );
      }
      throw Exception('No se pudo cambiar la contraseña: $msg');
    } catch (e) {
      logger.e('Unexpected error changing password', error: e);
      rethrow;
    }
  }
}
