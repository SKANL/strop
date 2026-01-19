// Quick Incident Type Selector
// lib/presentation/shell/widgets/quick_incident_type_selector.dart
//
// Replicates original app QuickIncidentTypeSelector pattern:
// - 4 incident types with colored icons
// - Role-based material request option
// - Navigates to create incident page

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';

/// Bottom sheet for selecting incident type
class QuickIncidentTypeSelector extends StatelessWidget {
  const QuickIncidentTypeSelector({
    required this.projectId,
    super.key,
  });

  final String projectId;

  @override
  Widget build(BuildContext context) {
    // Check user role for material request permission
    // Check user role for material request permission
    final user = context.read<AuthBloc>().state.user;
    final canRequestMaterials =
        user != null &&
        (user.role == UserRole.resident ||
            user.role == UserRole.superintendent ||
            user.role == UserRole.owner);

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
            '¿Qué deseas reportar?',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          // Subtitle
          Text(
            'Selecciona el tipo de reporte',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 24),

          // Incident types
          _buildTypeOption(
            context,
            icon: Icons.assignment_outlined,
            iconColor: AppColors.orderInstructionColor,
            title: 'Orden / Instrucción',
            subtitle: 'Emite una orden o instrucción',
            onTap: () => _navigateToCreate(context, 'ORDER_INSTRUCTION'),
          ),

          const SizedBox(height: 12),

          _buildTypeOption(
            context,
            icon: Icons.help_outline,
            iconColor: AppColors.requestQueryColor,
            title: 'Solicitud / Consulta',
            subtitle: 'Realiza una pregunta o solicitud',
            onTap: () => _navigateToCreate(context, 'REQUEST_QUERY'),
          ),

          const SizedBox(height: 12),

          _buildTypeOption(
            context,
            icon: Icons.verified_outlined,
            iconColor: AppColors.certificationColor,
            title: 'Certificación',
            subtitle: 'Solicita una certificación',
            onTap: () => _navigateToCreate(context, 'CERTIFICATION'),
          ),

          const SizedBox(height: 12),

          _buildTypeOption(
            context,
            icon: Icons.warning_amber_outlined,
            iconColor: AppColors.incidentNotificationColor,
            title: 'Notificación de Incidente',
            subtitle: 'Reporta un problema o incidente',
            onTap: () => _navigateToCreate(context, 'INCIDENT_NOTIFICATION'),
          ),

          // Material request (role-based)
          if (canRequestMaterials) ...[
            const SizedBox(height: 16),
            const Divider(),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'REQUIERE APROBACIÓN',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textHint,
                  letterSpacing: 0.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            _buildTypeOption(
              context,
              icon: Icons.inventory_2_outlined,
              iconColor: AppColors.warning,
              title: 'Solicitud de Material',
              subtitle: 'Solicita materiales para el proyecto',
              showBadge: true,
              onTap: () {
                Navigator.pop(context);
                // TODO(developer): Navigate to material request form
              },
            ),
          ],

          const SizedBox(height: 16),

          // Cancel button
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

  Widget _buildTypeOption(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool showBadge = false,
  }) {
    return InkWell(
      onTap: onTap,
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
            // Icon with background
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),

            const SizedBox(width: 16),

            // Text content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      if (showBadge)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Aprobación',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warning,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Arrow
            const Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToCreate(BuildContext context, String type) {
    Navigator.pop(context);
    unawaited(context.push('/projects/$projectId/create-incident?type=$type'));
  }
}
