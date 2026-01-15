import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:strop_app/data/models/comment_model.dart';
import 'package:strop_app/data/models/incident_model.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';
import 'package:strop_app/core/utils/logger.dart';

/// Supabase implementation of IncidentRepository
class SupabaseIncidentRepository implements IncidentRepository {
  SupabaseIncidentRepository({SupabaseClient? supabase})
    : _supabase = supabase ?? Supabase.instance.client;

  final SupabaseClient _supabase;

  @override
  Future<List<Incident>> getIncidents({
    String? projectId,
    String? assignedToId,
    String? createdById,
    bool? isOpen,
    int? limit,
    int? offset,
  }) async {
    try {
      dynamic query = _supabase.from('incidents').select('''
        *,
        created_by:users!created_by(*),
        assigned_to:users!assigned_to(*)
      ''');

      if (projectId != null) {
        query = query.eq('project_id', projectId);
      }
      if (assignedToId != null) {
        query = query.eq('assigned_to', assignedToId);
      }
      if (createdById != null) {
        query = query.eq('created_by', createdById);
      }
      if (isOpen != null) {
        if (isOpen) {
          query = query.neq('status', 'CLOSED');
        } else {
          query = query.eq('status', 'CLOSED');
        }
      }

      query = query
          .order('priority', ascending: true)
          .order('created_at', ascending: false);

      if (limit != null) {
        query = query.limit(limit);
      }
      if (offset != null) {
        query = query.range(offset, offset + limit! - 1);
      }

      final response = await query;

      return (response as List).map((json) {
        return IncidentModel.fromJson(json as Map<String, dynamic>);
      }).toList();
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase Error (getIncidents): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al cargar incidencias: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error fetching incidents', error: e, stackTrace: s);
      throw Exception('Error inesperado al cargar incidencias');
    }
  }

  @override
  Future<Map<String, int>> getDashboardStats() async {
    try {
      logger.d('RPC: Executing get_dashboard_stats...');
      // Use RPC for optimized single-query performance
      final response = await _supabase.rpc('get_dashboard_stats');
      logger.d('RPC: get_dashboard_stats success. Response: $response');

      if (response == null) return {'pending': 0, 'critical': 0};

      // Handle dynamic map response
      return {
        'pending': response['pending'] as int? ?? 0,
        'critical': response['critical'] as int? ?? 0,
      };
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (get_dashboard_stats): ${e.message}',
        error: e,
        stackTrace: s,
      );
      return {'pending': 0, 'critical': 0};
    } catch (e, s) {
      logger.e('Unexpected error fetching stats', error: e, stackTrace: s);
      return {'pending': 0, 'critical': 0};
    }
  }

  @override
  Future<Incident?> getIncidentById(String id) async {
    try {
      final response = await _supabase
          .from('incidents')
          .select(
            '*, created_by:users!created_by(*), assigned_to:users!assigned_to(*), photos(*)',
          )
          .eq('id', id)
          .single();

      final incidentModel = IncidentModel.fromJson(response);

      // Generate signed URLs for private photos
      if (incidentModel.photoUrls.isNotEmpty) {
        final signedUrls = await Future.wait(
          incidentModel.photoUrls.map((path) async {
            try {
              // Extract path if it's already a full URL (just in case) or use as is
              // But createSignedUrl expects the path relative to bucket root
              return await _supabase.storage
                  .from('incident-photos')
                  .createSignedUrl(path, 3600); // 1 hour expiry
            } catch (e) {
              logger.w('Failed to sign URL for photo: $path', error: e);
              return path; // Return original path as fallback
            }
          }),
        );
        return incidentModel.copyWith(photoUrls: signedUrls);
      }

      return incidentModel;
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase Error (getIncidentById): ${e.message}',
        error: e,
        stackTrace: s,
      );
      return null;
    } catch (e, s) {
      logger.e(
        'Unexpected error fetching incident $id',
        error: e,
        stackTrace: s,
      );
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
    try {
      logger.d('RPC: Executing create_incident for project $projectId');

      final response = await _supabase.rpc<String>(
        'create_incident',
        params: {
          'p_project_id': projectId,
          'p_title': title,
          'p_description': description,
          'p_incident_type': incidentType,
          'p_priority': priority,
          'p_location': location,
        },
      );

      logger.d('RPC: create_incident success. ID: $response');
      return response;
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (create_incident): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al crear incidencia: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error creating incident', error: e, stackTrace: s);
      throw Exception('Error inesperado al crear incidencia');
    }
  }

  @override
  Future<String> uploadPhoto({
    required String incidentId,
    required String filePath,
    required String fileName,
  }) async {
    try {
      // 1. Get current organization ID for path construction
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('No authenticated user');

      // Fetch from local metadata first if available, else query
      // For robustness, let's query the user profile to be sure we have the right context
      final userProfile = await _supabase
          .from('users')
          .select('current_organization_id')
          .eq('auth_id', user.id)
          .single();

      final orgId = userProfile['current_organization_id'];
      if (orgId == null) throw Exception('User has no active organization');

      // 2. Construct path: org-{id}/incident-{id}/{filename}
      final storagePath = 'org-$orgId/incident-$incidentId/$fileName';

      logger.d('Storage: Uploading photo to $storagePath');

      final file = File(filePath);
      await _supabase.storage
          .from('incident-photos')
          .upload(
            storagePath,
            file,
            fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
          );

      // 3. Get Public URL (or Signed URL if private bucket)
      // The bucket is private for listing but we can assume we want a signed URL or just the path
      // stored in the DB. The 'photos' table usually stores the path or URL.
      // Let's return the path for now, or the public URL if public.
      // Based on schema, 'incident-photos' is PRIVATE.
      // The `photos` table usually stores the full URL or just the storage path?
      // Re-checking standard implementations: storing the path is better for generating signed URLs later.
      // But for simplicity of this return, let's return the path.

      return storagePath;
    } on StorageException catch (e, s) {
      logger.e(
        'Storage Error (uploadPhoto): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al subir foto: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error uploading photo', error: e, stackTrace: s);
      throw Exception('Error inesperado al subir foto');
    }
  }

  @override
  Future<List<Comment>> getComments(String incidentId) async {
    try {
      logger.d('RPC: Executing get_incident_comments for incident $incidentId');
      final response = await _supabase.rpc<List<dynamic>>(
        'get_incident_comments',
        params: {'p_incident_id': incidentId},
      );

      logger.d('RPC: Fetched ${response.length} comments');
      return response
          .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (get_incident_comments): ${e.message}',
        error: e,
        stackTrace: s,
      );
      throw Exception('Error al cargar comentarios: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error loading comments', error: e, stackTrace: s);
      throw Exception('Error inesperado al cargar comentarios');
    }
  }

  @override
  Future<String> addComment({
    required String incidentId,
    required String text,
  }) async {
    try {
      logger.d('RPC: Executing add_incident_comment...');
      final response = await _supabase.rpc<String>(
        'add_incident_comment',
        params: {'p_incident_id': incidentId, 'p_text': text},
      );

      logger.d('RPC: Comment added successfully. ID: $response');
      return response;
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (add_incident_comment): ${e.message}',
        error: e,
        stackTrace: s,
      );
      // Simplify error for user if known
      if (e.message.contains('Permission denied')) {
        throw Exception('No tienes permiso para comentar en esta incidencia.');
      }
      throw Exception('Error al publicar comentario: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error posting comment', error: e, stackTrace: s);
      throw Exception('Error inesperado al publicar comentario');
    }
  }

  @override
  Future<void> closeIncident({
    required String incidentId,
    String? closedNotes,
  }) async {
    try {
      logger.d('RPC: Executing close_incident...');
      await _supabase.rpc<void>(
        'close_incident',
        params: {'p_incident_id': incidentId, 'p_closed_notes': closedNotes},
      );
      logger.d('RPC: Incident closed successfully.');
    } on PostgrestException catch (e, s) {
      logger.e(
        'Supabase RPC Error (close_incident): ${e.message}',
        error: e,
        stackTrace: s,
      );
      if (e.message.contains('Permission denied')) {
        throw Exception('No tienes permiso para cerrar esta incidencia.');
      }
      throw Exception('Error al cerrar incidencia: ${e.message}');
    } catch (e, s) {
      logger.e('Unexpected error closing incident', error: e, stackTrace: s);
      throw Exception('Error inesperado al cerrar incidencia');
    }
  }
}
