import 'package:strop_app/core/utils/logger.dart';
import 'package:strop_app/data/models/project_model.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/project_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase implementation of ProjectRepository
class SupabaseProjectRepository implements ProjectRepository {
  SupabaseProjectRepository({SupabaseClient? supabase})
    : _supabase = supabase ?? Supabase.instance.client;

  final SupabaseClient _supabase;

  @override
  Future<List<Project>> getProjects() async {
    try {
      logger.d('RPC: Executing get_my_projects...');
      // Use RPC for optimized query with pre-calculated counts
      // get_my_projects() returns projects for the current user with member_count and open_incidents_count
      final response = await _supabase.rpc<dynamic>('get_my_projects');

      final projects = (response as List).map((json) {
        return ProjectModel.fromJson(json as Map<String, dynamic>);
      }).toList();

      logger.d(
        'RPC: get_my_projects success. Found ${projects.length} projects.',
      );
      return projects;
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (get_my_projects): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al cargar proyectos: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error fetching projects', error: e, stackTrace: s);
      throw Exception('Error inesperado al cargar proyectos');
    }
  }

  @override
  Future<Project?> getProjectById(String id) async {
    try {
      final response = await _supabase
          .from('projects')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return ProjectModel.fromJson(response);
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase Error (getProjectById): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al cargar detalle del proyecto: ${e.message}');
    } catch (e, s) {
      logger.e(
        'Unexpected error fetching project $id',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error inesperado al cargar detalle del proyecto');
    }
  }
}
