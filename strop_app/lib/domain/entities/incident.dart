// Domain Entity - Incident
// lib/domain/entities/incident.dart

import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/enums.dart';
import 'package:strop_app/domain/entities/user.dart';

/// Incident entity matching Supabase incidents table
class Incident extends Equatable {
  const Incident({
    required this.id,
    required this.organizationId,
    required this.projectId,
    required this.type,
    required this.title,
    required this.description,
    this.location,
    this.priority = IncidentPriority.normal,
    this.status = IncidentStatus.open,
    this.createdById,
    this.createdBy,
    this.assignedToId,
    this.assignedTo,
    this.closedAt,
    this.closedById,
    this.closedBy,
    this.closedNotes,
    this.createdAt,
    this.photoUrls = const [],
    this.commentsCount = 0,
  });

  final String id;
  final String organizationId;
  final String projectId;
  final IncidentType type;
  final String title;
  final String description;
  final String? location;
  final IncidentPriority priority;
  final IncidentStatus status;
  final String? createdById;
  final User? createdBy;
  final String? assignedToId;
  final User? assignedTo;
  final DateTime? closedAt;
  final String? closedById;
  final User? closedBy;
  final String? closedNotes;
  final DateTime? createdAt;

  // Related data
  final List<String> photoUrls;
  final int commentsCount;

  /// Check if incident is critical
  bool get isCritical => priority == IncidentPriority.critical;

  /// Check if incident is open
  bool get isOpen => status == IncidentStatus.open;

  /// Check if incident is closed
  bool get isClosed => status == IncidentStatus.closed;

  /// Get time since creation
  Duration get timeSinceCreation {
    if (createdAt == null) return Duration.zero;
    return DateTime.now().difference(createdAt!);
  }

  /// Get formatted time ago string
  String get timeAgo {
    final duration = timeSinceCreation;
    if (duration.inDays > 0) {
      return 'hace ${duration.inDays} días';
    } else if (duration.inHours > 0) {
      return 'hace ${duration.inHours} horas';
    } else if (duration.inMinutes > 0) {
      return 'hace ${duration.inMinutes} min';
    }
    return 'ahora';
  }

  Incident copyWith({
    String? id,
    String? organizationId,
    String? projectId,
    IncidentType? type,
    String? title,
    String? description,
    String? location,
    IncidentPriority? priority,
    IncidentStatus? status,
    String? createdById,
    User? createdBy,
    String? assignedToId,
    User? assignedTo,
    DateTime? closedAt,
    String? closedById,
    User? closedBy,
    String? closedNotes,
    DateTime? createdAt,
    List<String>? photoUrls,
    int? commentsCount,
  }) {
    return Incident(
      id: id ?? this.id,
      organizationId: organizationId ?? this.organizationId,
      projectId: projectId ?? this.projectId,
      type: type ?? this.type,
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      createdById: createdById ?? this.createdById,
      createdBy: createdBy ?? this.createdBy,
      assignedToId: assignedToId ?? this.assignedToId,
      assignedTo: assignedTo ?? this.assignedTo,
      closedAt: closedAt ?? this.closedAt,
      closedById: closedById ?? this.closedById,
      closedBy: closedBy ?? this.closedBy,
      closedNotes: closedNotes ?? this.closedNotes,
      createdAt: createdAt ?? this.createdAt,
      photoUrls: photoUrls ?? this.photoUrls,
      commentsCount: commentsCount ?? this.commentsCount,
    );
  }

  @override
  List<Object?> get props => [
    id,
    organizationId,
    projectId,
    type,
    title,
    description,
    location,
    priority,
    status,
    assignedToId,
    closedAt,
    photoUrls,
    commentsCount,
  ];
}

/// Comment entity matching Supabase comments table
class Comment extends Equatable {
  const Comment({
    required this.id,
    required this.incidentId,
    required this.text,
    this.authorId,
    this.author,
    this.createdAt,
  });

  final String id;
  final String incidentId;
  final String text;
  final String? authorId;
  final User? author;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [id, incidentId, text, authorId, createdAt];
}
