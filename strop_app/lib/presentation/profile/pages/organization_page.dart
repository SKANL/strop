import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:strop_app/core/theme/app_colors.dart';

class OrganizationPage extends StatelessWidget {
  const OrganizationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Organización'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildHeader(context),
          const SizedBox(height: 32),
          _buildQuotaSection(context),
          const SizedBox(height: 32),
          _buildPlanSection(context),
          const SizedBox(height: 32),
          _buildActions(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x331A237E),
                  blurRadius: 20,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(Icons.business, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            'Constructora Demo S.A.',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'tenant-id: cdemo-1234',
            style: TextStyle(
              color: AppColors.textHint,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuotaSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'USO Y CUOTAS',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F000000),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              _buildQuotaItem(
                context,
                icon: Icons.cloud_outlined,
                title: 'Almacenamiento',
                used: 2.5,
                total: 5.0,
                unit: 'GB',
                color: AppColors.primary,
              ),
              const Divider(height: 32),
              _buildQuotaItem(
                context,
                icon: Icons.people_outline,
                title: 'Usuarios',
                used: 8,
                total: 10,
                unit: 'miembros',
                color: AppColors.accent,
              ),
              const Divider(height: 32),
              _buildQuotaItem(
                context,
                icon: Icons.folder_open,
                title: 'Proyectos Activos',
                used: 3,
                total: 5,
                unit: 'proyectos',
                color: AppColors.roleSuperintendent,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuotaItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required double used,
    required double total,
    required String unit,
    required Color color,
  }) {
    final progress = used / total;
    final percentage = (progress * 100).toInt();

    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.textSecondary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            Text(
              '${used is int ? used : used.toStringAsFixed(1)} / ${total is int ? total : total.toStringAsFixed(0)} $unit',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.backgroundLight,
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            '$percentage%',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlanSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF3949AB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.star, color: Colors.white, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Plan Professional',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Renueva el 15 Feb 2026',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            child: const Text('Gestionar'),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Column(
      children: [
        ListTile(
          onTap: () => context.go('/settings/organization/users'),
          contentPadding: EdgeInsets.zero,
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.people, color: AppColors.accent),
          ),
          title: const Text('Gestionar Usuarios'),
          subtitle: const Text('Invita y asigna roles a tu equipo'),
          trailing: const Icon(Icons.chevron_right),
        ),
        const Divider(),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.payments_outlined, color: Colors.green),
          ),
          title: const Text('Facturación'),
          subtitle: const Text('Historial de pagos y facturas'),
          trailing: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}
