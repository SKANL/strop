// Project Detail Page - Tabbed View
// lib/presentation/projects/pages/project_detail_page.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/projects/widgets/project_dashboard_widgets.dart';
import 'package:strop_app/presentation/projects/widgets/project_selector_app_bar.dart';

class ProjectDetailPage extends StatefulWidget {

  const ProjectDetailPage({
    required this.projectId, super.key,
  });
  final String projectId;

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final project = MockDataService.mockProjects.firstWhere(
      (p) => p.id == widget.projectId,
      orElse: () => MockDataService.mockProjects.first,
    );

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: ProjectSelectorAppBar(currentProject: project),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Resumen'),
            Tab(text: 'Incidencias'),
            Tab(text: 'Bitácora'),
            Tab(text: 'Equipo'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _DashboardTab(project: project, tabController: _tabController),
          _IncidentsTab(project: project),
          _BitacoraTab(project: project),
          _TeamTab(project: project),
        ],
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab({
    required this.project,
    required this.tabController,
  });

  final Project project;
  final TabController tabController;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ProjectHeader(
            projectName: project.name,
            location: project.location,
            progress: 0.65, // Mock progress
            status: project.status.displayName,
            deliveryDate: '15 Dic 2024', // Mock date
          ),
          const SizedBox(height: 24),

          BitacoraPreview(
            onViewAll: () => tabController.animateTo(2),
          ),
          const SizedBox(height: 80), // Space for FAB
        ],
      ),
    );
  }
}

class _IncidentsTab extends StatelessWidget {
  const _IncidentsTab({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    final incidents = MockDataService.getIncidentsForProject(project.id);

    if (incidents.isEmpty) {
      return _buildEmptyState(context);
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 16),
      itemCount: incidents.length,
      itemBuilder: (context, index) =>
          _buildIncidentItem(context, incidents[index]),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.task_alt,
            size: 64,
            color: AppColors.success.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Sin incidencias',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildIncidentItem(BuildContext context, Incident incident) {
    return InkWell(
      onTap: () => context.push('/incident/${incident.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.getIncidentTypeColor(incident.type.name),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.getStatusColor(
                            incident.status.name,
                          ).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          incident.status.displayName,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.getStatusColor(
                              incident.status.name,
                            ),
                          ),
                        ),
                      ),
                      constSpacer(),
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
            const Icon(Icons.chevron_right, color: AppColors.textHint),
          ],
        ),
      ),
    );
  }

  Widget constSpacer() => const Spacer();
}

class _BitacoraTab extends StatelessWidget {
  const _BitacoraTab({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    // Mock timeline events
    final events = [
      {
        'date': 'Hoy',
        'items': [
          {
            'time': '09:00',
            'title': 'Inicio de jornada laboral',
            'type': 'SYSTEM',
            'user': 'Sistema',
          },
          {
            'time': '10:30',
            'title': 'Reporte de incidente #123 creado',
            'type': 'INCIDENT',
            'user': 'Juan Pérez',
          },
          {
            'time': '11:45',
            'title': 'Ingreso de material: Acero 3/8',
            'type': 'MANUAL',
            'user': 'Almacén',
          },
        ],
      },
      {
        'date': 'Ayer',
        'items': [
          {
            'time': '18:00',
            'title': 'Cierre de bitácora diario',
            'type': 'BESOP',
            'user': 'Sistema',
          },
          {
            'time': '14:20',
            'title': 'Visita de supervisión técnica',
            'type': 'MANUAL',
            'user': 'Arq. López',
          },
        ],
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final day = events[index];
        final items = day['items']! as List<Map<String, String>>;
        final isLastDay = index == events.length - 1;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Header
            Padding(
              padding: const EdgeInsets.only(bottom: 16, top: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundLight,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      day['date']! as String,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(indent: 12)),
                ],
              ),
            ),
            // Timeline Items
            ...items.asMap().entries.map((entry) {
              final isLastItem = isLastDay && entry.key == items.length - 1;
              return _buildTimelineItem(context, entry.value, isLastItem);
            }),
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }

  Widget _buildTimelineItem(
    BuildContext context,
    Map<String, String> item,
    bool isLast,
  ) {
    final color = _getEventColor(item['type']!);
    final icon = _getEventIcon(item['type']!);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Time Column
          SizedBox(
            width: 50,
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                item['time']!,
                textAlign: TextAlign.right,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textHint,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Timeline Line & Dot
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: Icon(icon, size: 12, color: color),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: AppColors.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title']!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        item['user']!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getEventColor(String type) {
    switch (type) {
      case 'INCIDENT':
        return AppColors.accent;
      case 'BESOP':
        return AppColors.success;
      case 'MANUAL':
        return AppColors.primary;
      case 'SYSTEM':
        return AppColors.textSecondary;
      default:
        return AppColors.textHint;
    }
  }

  IconData _getEventIcon(String type) {
    switch (type) {
      case 'INCIDENT':
        return Icons.warning_amber_rounded;
      case 'BESOP':
        return Icons.check_circle_outline;
      case 'MANUAL':
        return Icons.edit_note;
      case 'SYSTEM':
        return Icons.dns_outlined;
      default:
        return Icons.circle;
    }
  }
}

class _TeamTab extends StatelessWidget {
  const _TeamTab({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    // Mock members
    final members = [
      {'name': 'Ing. Juan Pérez', 'role': 'Superintendente'},
      {'name': 'Arq. María López', 'role': 'Residente'},
      {'name': 'Carlos Ruiz', 'role': 'Cabo'},
    ];

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: members.length,
      separatorBuilder: (_, __) => const Divider(),
      itemBuilder: (context, index) {
        final member = members[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(
              member['name']!.substring(0, 1),
              style: const TextStyle(color: AppColors.primary),
            ),
          ),
          title: Text(member['name']!),
          subtitle: Text(member['role']!),
          trailing: IconButton(
            icon: const Icon(Icons.phone_outlined),
            onPressed: () {
              // TODO(developer): Call member
            },
          ),
        );
      },
    );
  }
}
