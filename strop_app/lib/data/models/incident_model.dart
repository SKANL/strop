import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/entities/enums.dart';
import 'package:strop_app/data/models/user_model.dart';

class IncidentModel extends Incident {
  const IncidentModel({
    required super.id,
    required super.organizationId,
    required super.projectId,
    required super.type,
    required super.title,
    required super.description,
    super.location,
    super.priority,
    super.status,
    super.createdById,
    super.createdBy,
    super.assignedToId,
    super.assignedTo,
    super.closedAt,
    super.closedById,
    super.closedBy,
    super.closedNotes,
    super.createdAt,
    super.photoUrls,
    super.commentsCount,
  });

  factory IncidentModel.fromJson(Map<String, dynamic> json) {
    return IncidentModel(
      id: json['id'] as String,
      organizationId: json['organization_id'] as String,
      projectId: json['project_id'] as String,
      type: _parseType(json['type'] as String),
      title: json['title'] as String,
      description: json['description'] as String,
      location: json['location'] as String?,
      priority: _parsePriority(json['priority'] as String?),
      status: _parseStatus(json['status'] as String?),
      createdById:
          json['created_by_id'] as String? ??
          (json['created_by'] is String ? json['created_by'] as String : null),
      // Handle nested user objects if present
      createdBy: json['created_by'] is Map<String, dynamic>
          ? UserModel.fromJson(json['created_by'] as Map<String, dynamic>)
          : null,
      assignedTo: json['assigned_to'] is Map<String, dynamic>
          ? UserModel.fromJson(json['assigned_to'] as Map<String, dynamic>)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      photoUrls:
          (json['photos'] as List<dynamic>?)
              ?.map((e) => e['storage_path'] as String)
              .toList() ??
          [],
    );
  }

  static IncidentType _parseType(String type) {
    return IncidentType.values.firstWhere(
      (e) =>
          e.name.toUpperCase() == type.toUpperCase() ||
          e.toString().split('.').last.toUpperCase() == type.toUpperCase(),
      orElse: () => IncidentType.incidentNotification,
    );
  }

  static IncidentPriority _parsePriority(String? priority) {
    if (priority == null) return IncidentPriority.normal;
    return IncidentPriority.values.firstWhere(
      (e) => e.name.toUpperCase() == priority.toUpperCase(),
      orElse: () => IncidentPriority.normal,
    );
  }

  static IncidentStatus _parseStatus(String? status) {
    if (status == null) return IncidentStatus.open;
    return IncidentStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == status.toUpperCase(),
      orElse: () => IncidentStatus.open,
    );
  }
}
