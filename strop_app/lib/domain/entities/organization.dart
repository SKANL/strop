// Domain Entity - Organization
// lib/domain/entities/organization.dart

import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/enums.dart';

/// Organization entity matching Supabase organizations table
class Organization extends Equatable {
  const Organization({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
    this.billingEmail,
    this.storageQuotaMb = 5000,
    this.maxUsers = 50,
    this.maxProjects = 100,
    this.plan = SubscriptionPlan.starter,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String slug;
  final String? logoUrl;
  final String? billingEmail;
  final int storageQuotaMb;
  final int maxUsers;
  final int maxProjects;
  final SubscriptionPlan plan;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => [
    id,
    name,
    slug,
    logoUrl,
    plan,
    isActive,
  ];
}
