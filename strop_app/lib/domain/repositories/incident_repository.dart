import 'package:strop_app/domain/entities/entities.dart';

/// Interface for Incident Repository
abstract class IncidentRepository {
  /// Get incidents with optional filters
  Future<List<Incident>> getIncidents({
    String? projectId,
    String? assignedToId,
    String? createdById,
    bool? isOpen,
    int? limit,
    int? offset,
  });

  /// Get incident stats for dashboard
  Future<Map<String, int>> getDashboardStats();

  /// Get incident by ID
  Future<Incident?> getIncidentById(String id);

  /// Create a new incident
  Future<String> createIncident({
    required String projectId,
    required String title,
    required String description,
    required String incidentType,
    required String priority,
    String? location,
  });

  /// Upload incident photo
  Future<String> uploadPhoto({
    required String incidentId,
    required String filePath,
    required String fileName,
  });

  /// Get comments for an incident
  Future<List<Comment>> getComments(String incidentId);

  /// Add a comment to an incident
  Future<String> addComment({
    required String incidentId,
    required String text,
  });

  /// Close an incident
  Future<void> closeIncident({
    required String incidentId,
    String? closedNotes,
  });
}
