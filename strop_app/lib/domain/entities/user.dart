// Domain Entity - User
// lib/domain/entities/user.dart

import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/enums.dart';

/// User entity matching Supabase users table
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.authId,
    this.currentOrganizationId,
    this.profilePictureUrl,
    this.isActive = true,
    this.themeMode = 'light',
    this.createdAt,
    this.updatedAt,
    this.role,
  });

  final String id;
  final String? authId;
  final String? currentOrganizationId;
  final String email;
  final String fullName;
  final String? profilePictureUrl;
  final bool isActive;
  final String themeMode;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  /// Role from organization_members (populated via join)
  final UserRole? role;

  /// Get user initials for avatar
  String get initials {
    final parts = fullName.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts[1][0]}'.toUpperCase();
    }
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';
  }

  /// Get first name for greeting
  String get firstName {
    final parts = fullName.split(' ');
    return parts.first;
  }

  User copyWith({
    String? id,
    String? authId,
    String? currentOrganizationId,
    String? email,
    String? fullName,
    String? profilePictureUrl,
    bool? isActive,
    String? themeMode,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      authId: authId ?? this.authId,
      currentOrganizationId:
          currentOrganizationId ?? this.currentOrganizationId,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      isActive: isActive ?? this.isActive,
      themeMode: themeMode ?? this.themeMode,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      role: role ?? this.role,
    );
  }

  @override
  List<Object?> get props => [
    id,
    authId,
    currentOrganizationId,
    email,
    fullName,
    profilePictureUrl,
    isActive,
    themeMode,
    role,
  ];
}
