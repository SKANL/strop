import 'package:strop_app/domain/entities/entities.dart';

/// Interface for Project Repository
abstract class ProjectRepository {
  /// Get all projects for current user
  Future<List<Project>> getProjects();

  /// Get project by ID
  Future<Project?> getProjectById(String id);
}
