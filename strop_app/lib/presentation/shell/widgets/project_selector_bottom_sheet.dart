// Project Selector Bottom Sheet
// lib/presentation/shell/widgets/project_selector_bottom_sheet.dart
//
// Replicates original app ProjectSelectorBottomSheet pattern:
// - Handle indicator
// - Title + subtitle
// - List of user's projects
// - On select: shows QuickIncidentTypeSelector OR executes custom callback

import 'dart:async';
import 'package:flutter/material.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/shell/widgets/quick_incident_type_selector.dart';

/// Bottom sheet for selecting a project
class ProjectSelectorBottomSheet extends StatelessWidget {
  const ProjectSelectorBottomSheet({
    required this.parentContext,
    this.onProjectSelected,
    super.key,
  });

  final BuildContext parentContext;
  final void Function(Project)? onProjectSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: AppShadows.bottomSheet,
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle indicator
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Title
          Text(
            'Selecciona un proyecto',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          // Subtitle
          Text(
            'Elige el proyecto',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 24),

          // Projects list
          _buildProjectsList(context),

          const SizedBox(height: 16),

          // Cancel button - 48dp min height per UX.md
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 52),
            ),
            child: const Text('Cancelar'),
          ),

          // Safe area padding
          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }

  Widget _buildProjectsList(BuildContext context) {
    final projects = MockDataService.activeProjects;

    if (projects.isEmpty) {
      return _buildEmptyState(context);
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 300),
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: projects.length,
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final project = projects[index];
          return _buildProjectOption(context, project);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.folder_off_outlined,
            size: 48,
            color: AppColors.textHint,
          ),
          const SizedBox(height: 12),
          Text(
            'No tienes proyectos asignados',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectOption(BuildContext context, Project project) {
    return InkWell(
      onTap: () => _handleSelection(context, project),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Row(
          children: [
            // Project icon with status color
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _getStatusColor(project.status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.folder_outlined,
                color: _getStatusColor(project.status),
                size: 24,
              ),
            ),

            const SizedBox(width: 12),

            // Project info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    project.name,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 14,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          project.location,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppColors.textSecondary,
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

            // Chevron
            const Icon(
              Icons.chevron_right,
              color: AppColors.textHint,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  void _handleSelection(BuildContext context, Project project) {
    if (onProjectSelected != null) {
      // Custom callback provided - close and execute
      Navigator.pop(context);
      onProjectSelected!(project);
      return;
    }

    // Default behavior: Close this sheet and open incident type selector
    // Use Navigator.pop to properly close, then wait for animation to complete
    Navigator.pop(context);

    // Wait for the bottom sheet close animation to complete
    // This ensures the context is properly cleaned up before opening the next sheet
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Double-check that the parent context is still mounted
      if (!parentContext.mounted) return;

      // Open the incident type selector
      unawaited(
        showModalBottomSheet<void>(
          context: parentContext,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => QuickIncidentTypeSelector(
            projectId: project.id,
          ),
        ),
      );
    });
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
