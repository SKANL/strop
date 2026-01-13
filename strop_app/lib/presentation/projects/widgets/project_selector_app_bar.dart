import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
// Just in case, though GoRouter handles context
import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/shell/widgets/project_selector_bottom_sheet.dart';

/// App Bar Title Widget that allows project switching
class ProjectSelectorAppBar extends StatelessWidget {
  const ProjectSelectorAppBar({
    required this.currentProject,
    super.key,
  });

  final Project currentProject;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _showProjectSelector(context),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      currentProject.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.keyboard_arrow_down,
                      size: 20,
                      color: AppColors.accent,
                    ),
                  ],
                ),
                Text(
                  currentProject.location,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showProjectSelector(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ProjectSelectorBottomSheet(
        parentContext: context,
        onProjectSelected: (project) {
          // Navigate to different project
          // Note: If using GoRouter with parameters, this pushes a new page on top
          // Ideally we might want to replace the current page if it's the same route structure
          // but specifically here we are inside ProjectDetailPage.
          // context.go('/projects/${project.id}') would be cleaner but let's check GoRouter usage.
          // context.push replacement is context.pushReplacement

          // We will use pushReplacement to avoid building a huge stack of project pages
          context.pushReplacement('/projects/${project.id}');
        },
      ),
    );
  }
}
