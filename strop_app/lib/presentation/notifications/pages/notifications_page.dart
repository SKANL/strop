// Notifications Page
// lib/presentation/notifications/pages/notifications_page.dart

import 'package:flutter/material.dart';
import 'package:strop_app/core/theme/app_colors.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock notifications
    final notifications = [
      {
        'title': 'Nuevo Incidente Asignado',
        'body': 'Se te ha asignado el incidente #1234 en Torre A.',
        'time': 'Hace 5 min',
        'isUnread': true,
        'type': 'incident',
      },
      {
        'title': 'Avance de Obra',
        'body': 'El reporte de colado de losa ha sido aprobado.',
        'time': 'Hace 2 horas',
        'isUnread': false,
        'type': 'success',
      },
      {
        'title': 'Alerta de Seguridad',
        'body': 'Recordatorio: Revisión de andamios pendiente.',
        'time': 'Ayer',
        'isUnread': false,
        'type': 'alert',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Notificaciones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check_circle_outline),
            onPressed: () {
              // TODO: Mark all as read
            },
            tooltip: 'Marcar todo como leído',
          ),
        ],
      ),
      body: notifications.isEmpty
          ? _buildEmptyState(context)
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _buildNotificationItem(context, notification);
              },
            ),
    );
  }

  Widget _buildNotificationItem(
    BuildContext context,
    Map<String, dynamic> item,
  ) {
    final isUnread = item['isUnread'] as bool;
    final type = item['type'] as String;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isUnread ? Colors.white : Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(12),
        border: isUnread
            ? Border.all(color: AppColors.primary.withValues(alpha: 0.1))
            : null,
        boxShadow: isUnread
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildIcon(type),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item['title'] as String,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: isUnread
                              ? FontWeight.bold
                              : FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (isUnread)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item['body'] as String,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item['time'] as String,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIcon(String type) {
    IconData iconData;
    Color color;

    switch (type) {
      case 'incident':
        iconData = Icons.assignment_outlined;
        color = AppColors.primary;
        break;
      case 'success':
        iconData = Icons.check_circle_outline;
        color = AppColors.success;
        break;
      case 'alert':
        iconData = Icons.warning_amber_rounded;
        color = AppColors.warning;
        break;
      default:
        iconData = Icons.notifications_outlined;
        color = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(iconData, color: color, size: 24),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_off_outlined,
            size: 64,
            color: AppColors.textHint.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No tienes notificaciones',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
