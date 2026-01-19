import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';

/// Mock implementation of [IncidentRepository] for development/testing
class MockIncidentRepository implements IncidentRepository {
  @override
  Future<List<Incident>> getIncidents({
    String? projectId,
    String? assignedToId,
    String? createdById,
    bool? isOpen,
    int? limit,
    int? offset,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));

    var incidents = MockDataService.mockIncidents;

    if (projectId != null) {
      incidents = incidents.where((i) => i.projectId == projectId).toList();
    }
    if (assignedToId != null) {
      incidents = incidents
          .where((i) => i.assignedToId == assignedToId)
          .toList();
    }
    if (createdById != null) {
      incidents = incidents.where((i) => i.createdById == createdById).toList();
    }
    if (isOpen ?? false) {
      incidents = incidents
          .where((i) => i.status != IncidentStatus.closed)
          .toList();
    }

    return incidents;
  }

  @override
  Future<Map<String, int>> getDashboardStats() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return MockDataService.todaySummary;
  }

  @override
  Future<Incident?> getIncidentById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    try {
      return MockDataService.mockIncidents.firstWhere((i) => i.id == id);
    } catch (e) {
      return null;
    }
  }

  @override
  Future<String> createIncident({
    required String projectId,
    required String title,
    required String description,
    required String incidentType,
    required String priority,
    String? location,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    // Mock: just return a fake ID
    return 'inc-mock-${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  Future<String> uploadPhoto({
    required String incidentId,
    required String filePath,
    required String fileName,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return 'https://mock.storage/photos/$fileName';
  }

  @override
  Future<List<Comment>> getComments(String incidentId) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return MockDataService.getCommentsForIncident(incidentId);
  }

  @override
  Future<String> addComment({
    required String incidentId,
    required String text,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return 'comment-mock-${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  Future<void> closeIncident({
    required String incidentId,
    String? closedNotes,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    // Mock: doesn't persist anything
  }
}
