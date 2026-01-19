import 'package:logger/logger.dart';
import 'package:strop_app/domain/entities/user.dart' as domain;
import 'package:strop_app/domain/repositories/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseAuthRepository implements AuthRepository {

  SupabaseAuthRepository(this._supabase);
  final SupabaseClient _supabase;
  final Logger _logger = Logger();

  @override
  Future<domain.User> login(String email, String password) async {
    try {
      print('STROP_LOG: Attempting login for: $email');
      _logger.i('Attempting login for: $email');

      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        _logger.e('Login failed: User is null after signInWithPassword');
        throw Exception('No se pudo iniciar sesión. Intenta nuevamente.');
      }

      _logger.i('Login successful. User ID: ${response.user!.id}');
      return _mapUser(response.user!);
    } on AuthException catch (e, stack) {
      _logger.e('Auth exception during login', error: e, stackTrace: stack);
      print('STROP_LOG: Auth Error: ${e.message}');

      // Specific AuthException handling
      if (e.message.contains('Invalid login credentials')) {
        throw Exception(
          'Credenciales incorrectas. Verifica tu correo y contraseña.',
        );
      } else if (e.message.contains('Email not confirmed')) {
        throw Exception(
          'Correo no confirmado. Por favor revisa tu bandeja de entrada.',
        );
      } else if (e.message.contains('User not found')) {
        throw Exception(
          'No existe una cuenta con este correo. Regístrate primero.',
        );
      } else if (e.message.contains('Too many requests')) {
        throw Exception(
          'Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.',
        );
      } else if (e.message.contains('Email rate limit exceeded')) {
        throw Exception(
          'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
        );
      } else {
        throw Exception('Error de autenticación: ${e.message}');
      }
    } catch (e, stack) {
      _logger.e(
        'Unexpected exception during login',
        error: e,
        stackTrace: stack,
      );
      print('STROP_LOG: Unexpected Error: $e');

      // Network errors
      if (e.toString().contains('SocketException') ||
          e.toString().contains('Failed host lookup')) {
        throw Exception(
          'Sin conexión a internet. Verifica tu conexión y vuelve a intentar.',
        );
      } else if (e.toString().contains('TimeoutException') ||
          e.toString().contains('timed out')) {
        throw Exception(
          'La conexión tardó demasiado. Verifica tu conexión e intenta nuevamente.',
        );
      } else if (e.toString().contains('ClientException')) {
        throw Exception(
          'Error de conexión. Verifica tu red e intenta nuevamente.',
        );
      }

      // If it's already an Exception with a message, rethrow it
      if (e is Exception) {
        rethrow;
      }

      // Generic fallback
      throw Exception(
        'Error inesperado al iniciar sesión. Por favor intenta nuevamente.',
      );
    }
  }

  @override
  Future<void> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      print('STROP_LOG: Attempting registration for: $email');
      _logger.i('Attempting registration for: $email');

      // 1. Sign Up
      final authResponse = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': fullName},
      );

      if (authResponse.user == null) {
        _logger.e('Registration failed: User is null in authResponse');
        throw Exception('No se pudo crear la cuenta. Intenta nuevamente.');
      }

      final userId = authResponse.user!.id;
      print('STROP_LOG: User created in Auth. ID: $userId');
      _logger.i('User created in Auth. ID: $userId');

      // Note: Trigger 'handle_new_user' in DB will automatically assign organization
      // if an invitation exists for this email.
    } on AuthException catch (e, stack) {
      _logger.e(
        'Auth exception during registration',
        error: e,
        stackTrace: stack,
      );
      print('STROP_LOG: Auth Error: ${e.message}');

      // Specific AuthException handling
      if (e.message.contains('User already registered')) {
        throw Exception(
          'Este correo ya está registrado. Intenta iniciar sesión.',
        );
      } else if (e.message.contains('Password should be at least')) {
        throw Exception(
          'La contraseña debe tener al menos 6 caracteres.',
        );
      } else if (e.message.contains('Invalid email')) {
        throw Exception(
          'El formato del correo electrónico no es válido.',
        );
      } else if (e.message.contains('Email rate limit exceeded')) {
        throw Exception(
          'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
        );
      } else if (e.message.contains('Signup disabled')) {
        throw Exception(
          'El registro está temporalmente deshabilitado. Contacta al administrador.',
        );
      } else {
        throw Exception('Error de autenticación: ${e.message}');
      }
    } on PostgrestException catch (e, stack) {
      _logger.e(
        'Database exception during registration',
        error: e,
        stackTrace: stack,
      );
      print('STROP_LOG: Database Error: ${e.message}');

      if (e.message.contains('duplicate key')) {
        throw Exception(
          'Este correo ya está registrado. Intenta iniciar sesión.',
        );
      } else if (e.message.contains('violates check constraint')) {
        throw Exception(
          'Los datos ingresados no cumplen con los requisitos.',
        );
      } else {
        throw Exception('Error de base de datos: ${e.message}');
      }
    } catch (e, stack) {
      _logger.e(
        'Unexpected exception during registration',
        error: e,
        stackTrace: stack,
      );
      print('STROP_LOG: Unexpected Error: $e');

      // Network errors
      if (e.toString().contains('SocketException') ||
          e.toString().contains('Failed host lookup')) {
        throw Exception(
          'Sin conexión a internet. Verifica tu conexión y vuelve a intentar.',
        );
      } else if (e.toString().contains('TimeoutException') ||
          e.toString().contains('timed out')) {
        throw Exception(
          'La conexión tardó demasiado. Verifica tu conexión e intenta nuevamente.',
        );
      } else if (e.toString().contains('ClientException')) {
        throw Exception(
          'Error de conexión. Verifica tu red e intenta nuevamente.',
        );
      }

      // Generic fallback
      throw Exception(
        'Error inesperado al registrarse. Por favor intenta nuevamente.',
      );
    }
  }

  @override
  Future<void> logout() async {
    await _supabase.auth.signOut();
  }

  @override
  Future<domain.User?> getCurrentUser() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;
    return _mapUser(user);
  }

  domain.User _mapUser(User user) {
    return domain.User(
      id: user.id,
      email: user.email ?? '',
      fullName: (user.userMetadata?['full_name'] as String?) ?? '',
      profilePictureUrl: user.userMetadata?['avatar_url'] as String?,
    );
  }
}
