import 'package:strop_app/domain/entities/entities.dart';

class ProjectModel extends Project {
  const ProjectModel({
    required super.id,
    required super.organizationId,
    required super.name,
    required super.location,
    required super.startDate,
    required super.endDate,
    super.status,
    super.ownerId,
    super.memberCount,
    super.openIncidentsCount,
    super.createdAt,
    super.updatedAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: json['id'] as String,
      organizationId: json['organization_id'] as String,
      name: json['name'] as String,
      location: json['location'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      status: _parseStatus(json['status'] as String?),
      ownerId: json['owner_id'] as String?,
      memberCount: json['member_count'] as int? ?? 0,
      openIncidentsCount: json['open_incidents_count'] as int? ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  static ProjectStatus _parseStatus(String? status) {
    if (status == null) return ProjectStatus.active;
    return ProjectStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == status.toUpperCase(),
      orElse: () => ProjectStatus.active,
    );
  }
}
