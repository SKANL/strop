// Domain Entity - Project
// lib/domain/entities/project.dart

import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/enums.dart';
import 'package:strop_app/domain/entities/user.dart';

/// Project entity matching Supabase projects table
class Project extends Equatable {
  const Project({
    required this.id,
    required this.organizationId,
    required this.name,
    required this.location,
    required this.startDate,
    required this.endDate,
    this.status = ProjectStatus.active,
    this.ownerId,
    this.owner,
    this.createdById,
    this.createdAt,
    this.updatedAt,
    this.memberCount = 0,
    this.openIncidentsCount = 0,
  });

  final String id;
  final String organizationId;
  final String name;
  final String location;
  final DateTime startDate;
  final DateTime endDate;
  final ProjectStatus status;
  final String? ownerId;
  final User? owner;
  final String? createdById;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Computed fields from joins
  final int memberCount;
  final int openIncidentsCount;

  /// Calculate project progress based on dates
  double get progress {
    final now = DateTime.now();
    if (now.isBefore(startDate)) return 0;
    if (now.isAfter(endDate)) return 1;
    final total = endDate.difference(startDate).inDays;
    final elapsed = now.difference(startDate).inDays;
    return total > 0 ? elapsed / total : 0.0;
  }

  /// Days remaining until end date
  int get daysRemaining {
    final remaining = endDate.difference(DateTime.now()).inDays;
    return remaining > 0 ? remaining : 0;
  }

  Project copyWith({
    String? id,
    String? organizationId,
    String? name,
    String? location,
    DateTime? startDate,
    DateTime? endDate,
    ProjectStatus? status,
    String? ownerId,
    User? owner,
    int? memberCount,
    int? openIncidentsCount,
  }) {
    return Project(
      id: id ?? this.id,
      organizationId: organizationId ?? this.organizationId,
      name: name ?? this.name,
      location: location ?? this.location,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      ownerId: ownerId ?? this.ownerId,
      owner: owner ?? this.owner,
      memberCount: memberCount ?? this.memberCount,
      openIncidentsCount: openIncidentsCount ?? this.openIncidentsCount,
    );
  }

  @override
  List<Object?> get props => [
    id,
    organizationId,
    name,
    location,
    startDate,
    endDate,
    status,
    ownerId,
    memberCount,
    openIncidentsCount,
  ];
}
