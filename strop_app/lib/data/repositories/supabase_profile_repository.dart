import 'package:strop_app/core/utils/logger.dart';
import 'package:strop_app/data/models/user_model.dart';
import 'package:strop_app/domain/entities/user.dart' as domain;
import 'package:strop_app/domain/repositories/profile_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseProfileRepository implements ProfileRepository {
  // Use global logger instance from core/utils/logger.dart

  SupabaseProfileRepository(this._supabase);
  final SupabaseClient _supabase;

  // Simple retry helper for transient errors
  Future<T> _retry<T>(
    Future<T> Function() fn, {
    int attempts = 3,
    bool isWrite = false,
  }) async {
    // For writes, fail fast (1 attempt, short delay)
    final maxAttempts = isWrite ? 1 : attempts;
    final baseDelayMs = isWrite ? 100 : 300;

    var attempt = 0;
    while (true) {
      attempt++;
      try {
        return await fn();
      } catch (e) {
        final isLast = attempt >= maxAttempts;
        if (!_isTransientError(e) || isLast) rethrow;
        final delayMs = baseDelayMs * (1 << (attempt - 1));
        logger.w(
          'Transient error, retrying in ${delayMs}ms (attempt $attempt) - $e',
        );
        await Future<void>.delayed(Duration(milliseconds: delayMs));
      }
    }
  }

  bool _isTransientError(Object e) {
    final msg = e.toString().toLowerCase();
    if (e is PostgrestException) {
      return false; // DB errors usually not transient
    }
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('timeout')) {
      return true;
    }
    return false;
  }

  @override
  Future<domain.User?> getMyProfile(String userId) async {
    final startTime = DateTime.now();
    try {
      logger.d('[PROFILE] getMyProfile started for userId=$userId');
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

      if (response == null) {
        logger.d(
          '[PROFILE] getMyProfile completed in ${DateTime.now().difference(startTime).inMilliseconds}ms (no user found)',
        );
        return null;
      }

      final user = UserModel.fromJson(response);
      logger.d(
        '[PROFILE] getMyProfile completed in ${DateTime.now().difference(startTime).inMilliseconds}ms',
      );
      return user;
    } on PostgrestException catch (e) {
      logger.e('DB error getting profile: ${e.message}');
      final msg = e.message;
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
  Future<domain.User> updateProfile(domain.User profile) async {
    final startTime = DateTime.now();
    try {
      logger.d('[PROFILE] updateProfile started for user id=${profile.id}');
      final updateData = {
        'full_name': profile.fullName,
        'profile_picture_url': profile.profilePictureUrl,
        'theme_mode': profile.themeMode,
        'current_organization_id': profile.currentOrganizationId,
      };

      // Update and return the updated row in one call (eliminates extra SELECT)
      final response = await _retry(
        () async {
          return await _supabase
              .from('users')
              .update(updateData)
              .eq('id', profile.id)
              .select(
                'id, email, full_name, auth_id, current_organization_id, profile_picture_url, is_active, theme_mode, created_at, updated_at',
              )
              .maybeSingle();
        },
        isWrite: true,
      );

      // If no row returned, try by auth_id as fallback
      if (response == null) {
        final authTarget = profile.authId ?? profile.id;
        logger.w(
          '[PROFILE] Update by id affected 0 rows; retrying by auth_id=$authTarget',
        );
        final fallbackResponse = await _retry(
          () async {
            return await _supabase
                .from('users')
                .update(updateData)
                .eq('auth_id', authTarget)
                .select(
                  'id, email, full_name, auth_id, current_organization_id, profile_picture_url, is_active, theme_mode, created_at, updated_at',
                )
                .maybeSingle();
          },
          isWrite: true,
        );

        if (fallbackResponse == null) {
          logger.e(
            '[PROFILE] Profile update failed: no rows matched by id or auth_id',
          );
          throw Exception(
            'No se pudo actualizar el perfil. Intenta nuevamente.',
          );
        }
        final updatedUser = UserModel.fromJson(fallbackResponse);
        logger.d(
          '[PROFILE] updateProfile completed in ${DateTime.now().difference(startTime).inMilliseconds}ms (via auth_id)',
        );

        // Sync auth metadata
        await _syncAuthMetadata(updatedUser);
        return updatedUser;
      }

      final updatedUser = UserModel.fromJson(response);
      logger.d(
        '[PROFILE] updateProfile completed in ${DateTime.now().difference(startTime).inMilliseconds}ms',
      );

      // Sync auth metadata
      await _syncAuthMetadata(updatedUser);
      return updatedUser;
    } on PostgrestException catch (e) {
      logger.e('DB error updating profile: ${e.message}');
      final msg = e.message;
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

  /// Sync Auth metadata (non-blocking, extracted for reuse)
  Future<void> _syncAuthMetadata(domain.User user) async {
    final currentAuthId = _supabase.auth.currentUser?.id;
    if (currentAuthId != null &&
        (user.authId == currentAuthId || user.id == currentAuthId)) {
      try {
        await _supabase.auth.updateUser(
          UserAttributes(
            data: {
              'full_name': user.fullName,
              'avatar_url': user.profilePictureUrl,
            },
          ),
        );
        logger.d('[PROFILE] Auth metadata synced successfully');
      } on AuthException catch (e) {
        logger.w(
          '[PROFILE] Auth metadata sync failed (non-critical)',
          error: e,
        );
      } catch (e) {
        logger.w(
          '[PROFILE] Auth metadata sync unexpected error (non-critical)',
          error: e,
        );
      }
    } else {
      logger.i(
        '[PROFILE] Skipping auth metadata sync: session user differs from profile',
      );
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
      final msg = e.message;
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
