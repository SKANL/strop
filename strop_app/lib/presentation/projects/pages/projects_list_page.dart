// Projects List Page
// lib/presentation/projects/pages/projects_list_page.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';

/// List of projects user has access to
class ProjectsListPage extends StatelessWidget {
  const ProjectsListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final projects = MockDataService.mockProjects;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Proyectos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // TODO(developer): Filter projects
            },
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: projects.length,
        itemBuilder: (context, index) {
          final project = projects[index];
          return _buildProjectCard(context, project);
        },
      ),
    );
  }

  Widget _buildProjectCard(BuildContext context, Project project) {
    return InkWell(
      onTap: () => unawaited(context.push('/projects/${project.id}')),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppShadows.card,
        ),
        child: Column(
          children: [
            // Image Header with Gradient & Status
            SizedBox(
              height: 150,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Cover Image
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: Image.network(
                      'https://picsum.photos/seed/${project.id}/800/400',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        child: const Icon(
                          Icons.apartment,
                          size: 48,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),

                  // 2. Gradient Overlay
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.7),
                          ],
                          stops: const [0.6, 1.0],
                        ),
                      ),
                    ),
                  ),

                  // 3. Status Badge (Top Right)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.circle,
                            size: 8,
                            color: _getStatusColor(project.status),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            project.status.displayName,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _getStatusColor(project.status),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // 4. Project Name & Location (Bottom Left)
                  Positioned(
                    bottom: 12,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(
                                offset: Offset(0, 1),
                                blurRadius: 4,
                                color: Colors.black45,
                              ),
                            ],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: Colors.white70,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                project.location,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Footer Statistics
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _buildFooterStat(
                    context,
                    Icons.people_alt_outlined,
                    '${project.memberCount}',
                    'Miembros',
                  ),
                  _buildDivider(),
                  _buildFooterStat(
                    context,
                    Icons.warning_amber_rounded,
                    '${project.openIncidentsCount}',
                    'Abiertas',
                    color: project.openIncidentsCount > 0
                        ? AppColors.priorityCritical
                        : null,
                  ),
                  _buildDivider(),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${(project.progress * 100).toInt()}%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: _getStatusColor(project.status),
                          ),
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: project.progress,
                            minHeight: 4,
                            backgroundColor: AppColors.backgroundLight,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              _getStatusColor(project.status),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooterStat(
    BuildContext context,
    IconData icon,
    String value,
    String label, {
    Color? color,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: color ?? AppColors.textHint,
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: color ?? AppColors.textPrimary,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 24,
      width: 1,
      color: AppColors.border,
      margin: const EdgeInsets.symmetric(horizontal: 16),
    );
  }

  Color _getStatusColor(ProjectStatus status) {
    switch (status) {
      case ProjectStatus.active:
        return AppColors.success;
      case ProjectStatus.paused:
        return AppColors.warning;
      case ProjectStatus.completed:
        return AppColors.textSecondary;
    }
  }
}
