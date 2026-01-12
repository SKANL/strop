// Home Page - Smart Feed Dashboard
// lib/presentation/home/pages/home_page.dart
//
// Following shadcn dashboard-01 structure:
// - Header with user info
// - Summary cards
// - Recent activity feed

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/home/widgets/sync_status_indicator.dart';
import 'package:strop_app/presentation/home/widgets/task_summary_card.dart';

/// Home page with smart feed dashboard
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = MockDataService.currentUser;
    final summary = MockDataService.todaySummary;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          // TODO(developer): Refresh data from repository
          await Future<void>.delayed(const Duration(seconds: 1));
        },
        child: CustomScrollView(
          slivers: [
            // Header with user greeting
            SliverToBoxAdapter(
              child: _buildHeader(context, user),
            ),

            // Summary cards
            SliverToBoxAdapter(
              child: _buildSummarySection(context, summary),
            ),

            // Quick access buttons
            SliverToBoxAdapter(
              child: _buildQuickAccess(context),
            ),

            // Recent activity
            SliverToBoxAdapter(
              child: _buildRecentActivityHeader(context),
            ),

            // Activity list
            _buildActivityList(context),

            // Bottom padding
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, User user) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 16,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: AppShadows.small,
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.getRoleColor(
                user.role?.name.toUpperCase() ?? 'RESIDENT',
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                user.initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Greeting
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getGreeting(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  user.firstName,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Sync status indicator
          const SyncStatusIndicator(),
        ],
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Buenos días,';
    if (hour < 18) return 'Buenas tardes,';
    return 'Buenas noches,';
  }

  Widget _buildSummarySection(BuildContext context, Map<String, int> summary) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PARA HOY',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TaskSummaryCard(
                  title: 'Pendientes',
                  count: summary['pendingTasks'] ?? 0,
                  color: AppColors.statusOpen,
                  icon: Icons.pending_actions,
                  onTap: () => context.go('/tasks'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TaskSummaryCard(
                  title: 'Críticas',
                  count: summary['criticalTasks'] ?? 0,
                  color: AppColors.priorityCritical,
                  icon: Icons.priority_high,
                  onTap: () => context.go('/tasks'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAccess(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _QuickAccessButton(
              icon: Icons.mic,
              label: 'Nota de voz',
              color: AppColors.primary,
              onTap: () {
                // TODO(developer): Voice note quick action
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _QuickAccessButton(
              icon: Icons.qr_code_scanner,
              label: 'Escanear QR',
              color: AppColors.accent,
              onTap: () {
                // TODO(developer): QR scanner quick action
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivityHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'ACTIVIDAD RECIENTE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          TextButton(
            onPressed: () {
              // TODO(developer): See all activity
            },
            child: const Text('Ver todo'),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityList(BuildContext context) {
    final incidents = MockDataService.openIncidents.take(5).toList();

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final incident = incidents[index];
          return _buildActivityItem(context, incident);
        },
        childCount: incidents.length,
      ),
    );
  }

  Widget _buildActivityItem(BuildContext context, Incident incident) {
    return InkWell(
      onTap: () => context.push('/incident/${incident.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppShadows.small,
        ),
        child: Row(
          children: [
            // Type indicator
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.getIncidentTypeColor(incident.type.name),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    incident.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      _buildStatusChip(
                        incident.status.displayName,
                        incident.status,
                      ),
                      const SizedBox(width: 8),
                      if (incident.isCritical) _buildPriorityChip(),
                      const Spacer(),
                      Text(
                        incident.timeAgo,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textHint,
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
    );
  }

  Widget _buildStatusChip(String label, IncidentStatus status) {
    final color = AppColors.getStatusColor(status.name);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildPriorityChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.priorityCritical.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.warning, size: 10, color: AppColors.priorityCritical),
          SizedBox(width: 2),
          Text(
            'CRÍTICA',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: AppColors.priorityCritical,
            ),
          ),
        ],
      ),
    );
  }
}

/// Quick access button widget
class _QuickAccessButton extends StatelessWidget {
  const _QuickAccessButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      // Minimum 48dp touch target per UX.md
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
