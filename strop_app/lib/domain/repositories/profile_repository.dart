import '../entities/user.dart';

abstract class ProfileRepository {
  Future<User?> getMyProfile(String userId);

  /// Updates profile and returns the updated user (avoids extra SELECT)
  Future<User> updateProfile(User profile);

  Future<void> changePassword(String newPassword);
}
