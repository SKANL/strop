import 'package:strop_app/domain/entities/entities.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.fullName,
    super.authId,
    super.currentOrganizationId,
    super.profilePictureUrl,
    super.isActive,
    super.themeMode,
    super.createdAt,
    super.updatedAt,
    super.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      authId: json['auth_id'] as String?,
      currentOrganizationId: json['current_organization_id'] as String?,
      profilePictureUrl: json['profile_picture_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      themeMode: json['theme_mode'] as String? ?? 'light',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      role: _parseRole(json['role'] as String?),
    );
  }

  static UserRole? _parseRole(String? role) {
    if (role == null) return null;
    try {
      return UserRole.values.firstWhere(
        (e) => e.name.toUpperCase() == role.toUpperCase(),
      );
    } catch (_) {
      return null;
    }
  }
}
