import 'package:strop_app/domain/entities/user.dart';

abstract class AuthRepository {
  Future<User> login(String email, String password);
  Future<void> register({
    required String email,
    required String password,
    required String fullName,
  });
  Future<void> logout();
  Future<User?> getCurrentUser();
}
