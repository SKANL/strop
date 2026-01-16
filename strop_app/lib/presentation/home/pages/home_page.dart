// Home Page - Smart Feed Dashboard
// lib/presentation/home/pages/home_page.dart

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';
import 'package:strop_app/presentation/auth/bloc/auth_state.dart';
import 'package:strop_app/presentation/home/bloc/home_bloc.dart';
import 'package:strop_app/presentation/profile/bloc/profile_bloc.dart';
import 'package:strop_app/presentation/profile/bloc/profile_event.dart';
import 'package:strop_app/presentation/profile/bloc/profile_state.dart';
import 'package:strop_app/presentation/home/widgets/sync_status_indicator.dart';
import 'package:strop_app/presentation/shared/widgets/strop_action_button.dart';
import 'package:strop_app/presentation/shared/widgets/strop_dashboard_card.dart';

/// Home page with smart feed dashboard
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final StreamSubscription _authSub;

  @override
  void initState() {
    super.initState();
    final authBloc = context.read<AuthBloc>();
    final current = authBloc.state.user;
    if (current != null) {
      context.read<ProfileBloc>().add(ProfileLoadRequested(current.id));
    }
    _authSub = authBloc.stream.listen((state) {
      final user = (state as AuthState).user;
      if (user != null) {
        context.read<ProfileBloc>().add(ProfileLoadRequested(user.id));
      }
    });
  }

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          context.read<HomeBloc>().add(HomeRefreshed());
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header with user greeting — now listens to ProfileBloc so
              // changes to the profile update the UI immediately.
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, state) {
                  final user = state.user;
                  if (user == null) return const SizedBox(height: 100);

                  return BlocBuilder<ProfileBloc, ProfileState>(
                    builder: (context, profileState) {
                      if (profileState is ProfileLoaded) {
                        return _buildHeader(context, profileState.user);
                      }
                      return _buildHeader(context, user);
                    },
                  );
                },
              ),

              // Summary cards
              BlocBuilder<HomeBloc, HomeState>(
                builder: (context, state) {
                  final summary = state is HomeLoaded
                      ? state.summaryStats
                      : {'pending': 0, 'critical': 0};
                  return _buildSummarySection(context, summary);
                },
              ),

              // Quick access buttons
              _buildQuickAccess(context),

              // Recent activity header
              _buildRecentActivityHeader(context),

              // Activity list
              BlocBuilder<HomeBloc, HomeState>(
                builder: (context, state) {
                  if (state is HomeLoading) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }
                  final incidents = state is HomeLoaded
                      ? state.recentActivity
                      : <Incident>[];
                  return _buildActivityList(context, incidents);
                },
              ),

              // Bottom padding for FAB and safe area
              const SizedBox(height: 100),
            ],
          ),
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
              child: user.profilePictureUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        user.profilePictureUrl!,
                        fit: BoxFit.cover,
                      ),
                    )
                  : Text(
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
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
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
                child: StropDashboardCard(
                  title: 'Pendientes',
                  count: summary['pending'] ?? 0,
                  color: AppColors.statusOpen,
                  icon: Icons.pending_actions,
                  onTap: () => context.go('/tasks'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StropDashboardCard(
                  title: 'Críticas',
                  count: summary['critical'] ?? 0,
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
    return const SizedBox.shrink();
  }

  Widget _buildRecentActivityHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
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
              // TODO: See all activity
            },
            child: const Text('Ver todo'),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityList(BuildContext context, List<Incident> incidents) {
    if (incidents.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text('No hay actividad reciente'),
        ),
      );
    }

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: incidents.take(5).length,
      padding: EdgeInsets.zero,
      itemBuilder: (context, index) {
        final incident = incidents[index];
        return _buildActivityItem(context, incident);
      },
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
