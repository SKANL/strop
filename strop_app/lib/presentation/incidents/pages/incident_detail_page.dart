import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';
import 'package:strop_app/presentation/incidents/bloc/incident_detail_bloc.dart';

class IncidentDetailPage extends StatelessWidget {
  final String incidentId;

  const IncidentDetailPage({
    required this.incidentId,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => IncidentDetailBloc(
        repository: context.read<IncidentRepository>(),
      )..add(LoadIncidentDetail(incidentId)),
      child: BlocConsumer<IncidentDetailBloc, IncidentDetailState>(
        listener: (context, state) {
          if (state is IncidentDetailLoaded) {
            if (state.actionError != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.actionError!),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                ),
              );
              context.read<IncidentDetailBloc>().add(ClearActionError());
            }
          }
        },
        builder: (context, state) {
          if (state is IncidentDetailLoading) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          } else if (state is IncidentDetailError) {
            return Scaffold(
              appBar: AppBar(title: const Text('Error')),
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(state.message, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.read<IncidentDetailBloc>().add(
                        LoadIncidentDetail(incidentId),
                      ),
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            );
          } else if (state is IncidentDetailLoaded) {
            return _IncidentDetailView(
              incident: state.incident,
              comments: state.comments,
              isCommentLoading: state.isCommentLoading,
              isClosing: state.isClosing,
            );
          }
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        },
      ),
    );
  }
}

class _IncidentDetailView extends StatefulWidget {
  final Incident incident;
  final List<Comment> comments;
  final bool isCommentLoading;
  final bool isClosing;

  const _IncidentDetailView({
    required this.incident,
    required this.comments,
    required this.isCommentLoading,
    required this.isClosing,
  });

  @override
  State<_IncidentDetailView> createState() => _IncidentDetailViewState();
}

class _IncidentDetailViewState extends State<_IncidentDetailView> {
  final TextEditingController _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _handleAddComment() {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    context.read<IncidentDetailBloc>().add(
      AddComment(widget.incident.id, text),
    );
    _commentController.clear();
    FocusScope.of(context).unfocus();
  }

  void _showCloseIncidentDialog() {
    final notesController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar Incidencia'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '¿Estás seguro de que quieres cerrar esta incidencia? Esta acción no se puede deshacer.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Notas de cierre (opcional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.getStatusColor('CLOSED'),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(context);
              context.read<IncidentDetailBloc>().add(
                CloseIncident(widget.incident.id, notesController.text),
              );
            },
            child: const Text('Cerrar Incidencia'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isClosing) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Cerrando incidencia...'),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with status header
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            backgroundColor: AppColors.getIncidentTypeColor(
              widget.incident.type.name,
            ),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                widget.incident.type.displayName,
                style: const TextStyle(fontSize: 14),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.getIncidentTypeColor(widget.incident.type.name),
                      AppColors.getIncidentTypeColor(
                        widget.incident.type.name,
                      ).withValues(alpha: 0.7),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              if (widget.incident.status != IncidentStatus.closed)
                IconButton(
                  icon: const Icon(Icons.check_circle_outline),
                  tooltip: 'Cerrar Incidencia',
                  onPressed: _showCloseIncidentDialog,
                ),
            ],
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and badges
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.incident.title,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                      if (widget.incident.priority == IncidentPriority.critical)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.priorityCritical.withValues(
                              alpha: 0.1,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.warning,
                                size: 12,
                                color: AppColors.priorityCritical,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'CRÍTICA',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.priorityCritical,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Status chip
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.getStatusColor(
                        widget.incident.status.name,
                      ).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      widget.incident.status.displayName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.getStatusColor(
                          widget.incident.status.name,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Description
                  const Text(
                    'DESCRIPCIÓN',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.incident.description,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),

                  // Location
                  if (widget.incident.location != null) ...[
                    _buildInfoRow(
                      context,
                      Icons.location_on_outlined,
                      'Ubicación',
                      widget.incident.location!,
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Created by
                  _buildInfoRow(
                    context,
                    Icons.person_outline,
                    'Reportado por',
                    widget.incident.createdBy?.fullName ?? 'Usuario',
                  ),
                  const SizedBox(height: 12),

                  // Created at
                  _buildInfoRow(
                    context,
                    Icons.schedule,
                    'Fecha',
                    _formatDate(widget.incident.createdAt),
                  ),

                  // Assigned to
                  if (widget.incident.assignedTo != null) ...[
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      context,
                      Icons.assignment_ind_outlined,
                      'Asignado a',
                      widget.incident.assignedTo!.fullName,
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Photos section
                  if (widget.incident.photoUrls.isNotEmpty) ...[
                    Text(
                      'EVIDENCIA (${widget.incident.photoUrls.length})',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: widget.incident.photoUrls.length,
                        itemBuilder: (context, index) {
                          final url = widget.incident.photoUrls[index];
                          return Container(
                            width: 120,
                            height: 120,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              color: AppColors.backgroundLight,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                              image: DecorationImage(
                                image: NetworkImage(url),
                                fit: BoxFit.cover,
                                onError: (obj, trace) {},
                              ),
                            ),
                            child: url.isEmpty
                                ? const Center(
                                    child: Icon(
                                      Icons.image,
                                      color: AppColors.textHint,
                                    ),
                                  )
                                : null,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  const Divider(),
                  const SizedBox(height: 16),

                  // Comments section
                  Text(
                    'COMENTARIOS (${widget.comments.length})',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildCommentsList(context),
                ],
              ),
            ),
          ),

          // Bottom padding
          const SliverToBoxAdapter(
            child: SizedBox(height: 80),
          ),
        ],
      ),
      bottomSheet: widget.incident.status != IncidentStatus.closed
          ? _buildCommentInput(context)
          : null,
    );
  }

  Widget _buildCommentsList(BuildContext context) {
    if (widget.isCommentLoading && widget.comments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (widget.comments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: Text(
            'No hay comentarios aún.\nSé el primero en comentar.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textHint),
          ),
        ),
      );
    }

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: widget.comments.length,
      itemBuilder: (context, index) {
        final comment = widget.comments[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage:
                    comment.author?.profilePictureUrl != null &&
                        comment.author!.profilePictureUrl!.isNotEmpty
                    ? NetworkImage(comment.author!.profilePictureUrl!)
                    : null,
                child: comment.author?.profilePictureUrl == null
                    ? Text(comment.author?.fullName[0] ?? '?')
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          comment.author?.fullName ?? 'Usuario',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(comment.createdAt),
                          style: const TextStyle(
                            color: AppColors.textHint,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(comment.text),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCommentInput(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -2),
            blurRadius: 10,
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  hintText: 'Escribe un comentario...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 0,
                    vertical: 8,
                  ),
                ),
                minLines: 1,
                maxLines: 3,
              ),
            ),
            IconButton(
              onPressed: widget.isCommentLoading ? null : _handleAddComment,
              icon: widget.isCommentLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send, color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textHint),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
