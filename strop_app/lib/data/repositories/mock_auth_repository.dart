import 'package:strop_app/domain/entities/user.dart';
import 'package:strop_app/domain/entities/enums.dart';
import 'package:strop_app/domain/repositories/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Future<User> login(String email, String password) async {
    await Future<void>.delayed(const Duration(seconds: 2)); // Sim network

    if (password == 'wrong') {
      throw Exception('Contraseña incorrecta');
    }

    if (email == 'error@strop.com') {
      throw Exception('Error de servidor simulado');
    }

    // Return a mock user
    return User(
      id: 'mock-user-123',
      email: email,
      fullName: 'Usuario Demo',
      role: UserRole.owner,
      currentOrganizationId: 'org-123',
      isActive: true,
      themeMode: 'light',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    required String organizationName,
  }) async {
    await Future<void>.delayed(const Duration(seconds: 3));
    if (email.contains('existe')) {
      throw Exception('El usuario ya está registrado');
    }
  }

  @override
  Future<void> logout() async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }

  @override
  Future<User?> getCurrentUser() async {
    // Return null to force login flow for now
    return null;
  }
}
