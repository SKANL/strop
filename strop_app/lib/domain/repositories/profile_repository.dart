import 'package:strop_app/domain/entities/user.dart';

/// Repository interface for user profile operations
abstract class ProfileRepository {
  /// Get the current user's profile by their ID
  Future<User?> getMyProfile(String userId);

  /// Update the user's profile
  Future<void> updateProfile(User profile);

  /// Change the user's password
  Future<void> changePassword(String newPassword);
}
