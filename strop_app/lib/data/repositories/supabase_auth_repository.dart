import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:strop_app/domain/entities/user.dart' as domain;
import 'package:strop_app/domain/repositories/auth_repository.dart';

class SupabaseAuthRepository implements AuthRepository {
  final SupabaseClient _supabase;
  final Logger _logger = Logger();

  SupabaseAuthRepository(this._supabase);

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
        throw Exception('Login failed: User is null');
      }

      _logger.i('Login successful. User ID: ${response.user!.id}');
      return _mapUser(response.user!);
    } catch (e, stack) {
      _logger.e('Login exception', error: e, stackTrace: stack);
      if (e is AuthException) {
        if (e.message.contains('Invalid login credentials')) {
          throw Exception(
            'Credenciales incorrectas. Verifica tu correo y contraseña.',
          );
        } else if (e.message.contains('Email not confirmed')) {
          throw Exception(
            'Correo no confirmado. Por favor revisa tu bandeja de entrada.',
          );
        }
        throw Exception(e.message);
      }
      rethrow;
    }
  }

  @override
  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    required String organizationName,
  }) async {
    try {
      print(
        'STROP_LOG: Attempting registration for: $email, Org: $organizationName',
      );
      _logger.i('Attempting registration for: $email, Org: $organizationName');

      // 1. Sign Up
      final authResponse = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': fullName},
      );

      if (authResponse.user == null) {
        _logger.e('Registration failed: User is null in authResponse');
        throw Exception('Registration failed: User is null');
      }

      final userId = authResponse.user!.id;
      print('STROP_LOG: User created in Auth. ID: $userId');
      _logger.i('User created in Auth. ID: $userId');

      // 2. Initialize Owner Organization via RPC
      print('STROP_LOG: Calling RPC: initialize_owner_organization');
      _logger.i('Calling RPC: initialize_owner_organization');

      await _supabase.rpc<void>(
        'initialize_owner_organization',
        params: {
          'org_name': organizationName,
          'plan_type': 'PROFESSIONAL',
        },
      );

      print('STROP_LOG: RPC execution successful. Organization created.');
      _logger.i('RPC execution successful. Organization created.');
    } catch (e, stack) {
      _logger.e('Registration exception', error: e, stackTrace: stack);
      print('STROP_LOG: Registration Error: $e');

      if (e is PostgrestException) {
        throw Exception('Database Error: ${e.message}');
      } else if (e is AuthException) {
        throw Exception('Auth Error: ${e.message}');
      }
      throw Exception('Registration Error: $e');
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
