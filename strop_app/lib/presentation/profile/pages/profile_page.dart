// Profile Page
// lib/presentation/profile/pages/profile_page.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/presentation/profile/bloc/profile_bloc.dart';
import 'package:strop_app/presentation/profile/bloc/profile_event.dart';
import 'package:strop_app/presentation/profile/bloc/profile_state.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';
import 'package:strop_app/presentation/auth/bloc/auth_event.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final TextEditingController _nameController;
  bool _isSaving = false;
  bool _isChangingPassword = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();

    final authUser = context.read<AuthBloc>().state.user;
    if (authUser != null) {
      context.read<ProfileBloc>().add(ProfileLoadRequested(authUser.id));
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Mi Perfil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings/notifications'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 32),
            BlocConsumer<ProfileBloc, ProfileState>(
              listener: (context, state) {
                if (state is ProfileLoaded) {
                  _nameController.text = state.user.fullName;
                  if (_isSaving) {
                    _isSaving = false;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Guardado correctamente')),
                    );
                  }
                }
                if (state is ProfilePasswordChangeSuccess) {
                  if (_isChangingPassword) {
                    _isChangingPassword = false;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(state.message)),
                    );
                  }
                }
                if (state is ProfileFailure) {
                  _isSaving = false;
                  _isChangingPassword = false;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(state.message)),
                  );
                }
              },
              builder: (context, state) {
                if (state is ProfileLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                final isLoaded = state is ProfileLoaded;
                final user = isLoaded
                    ? (state as ProfileLoaded).user
                    : context.read<AuthBloc>().state.user;

                if (user == null) return const SizedBox.shrink();

                return _buildProfileHeader(context, user, isLoaded);
              },
            ),
            const SizedBox(height: 32),
            _buildSyncSection(context),
            const SizedBox(height: 32),
            _buildOrganizationSection(context),
            const SizedBox(height: 32),
            _buildSecuritySection(context),
            const SizedBox(height: 32),
            _buildSettingsSection(context),
            const SizedBox(height: 32),
            _buildLogoutButton(context),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, User user, bool isLoaded) {
    return Column(
      children: [
        Hero(
          tag: 'current_user_avatar',
          child: CircleAvatar(
            radius: 50,
            backgroundColor: AppColors.roleSuperintendent,
            child: Text(
              user.initials,
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(border: InputBorder.none),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.roleSuperintendent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            user.role?.displayName ?? 'Sin Rol',
            style: const TextStyle(
              color: AppColors.roleSuperintendent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          user.email,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton.icon(
              onPressed: !isLoaded
                  ? null
                  : () async {
                      // Save profile — only allowed when ProfileBloc loaded the profile
                      final currentState = context.read<ProfileBloc>().state;
                      if (currentState is! ProfileLoaded) return;
                      final existing = currentState.user;
                      final updated = existing.copyWith(
                        fullName: _nameController.text.trim(),
                      );
                      _isSaving = true;
                      context.read<ProfileBloc>().add(
                        ProfileUpdateRequested(updated),
                      );
                    },
              icon: const Icon(Icons.save_outlined, size: 16),
              label: const Text('Guardar'),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
            const SizedBox(width: 8),
            TextButton.icon(
              onPressed: () async {
                // Change password dialog
                final result = await showDialog<String?>(
                  context: context,
                  builder: (ctx) {
                    final pwController = TextEditingController();
                    return AlertDialog(
                      title: const Text('Cambiar contraseña'),
                      content: TextField(
                        controller: pwController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Nueva contraseña',
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text('Cancelar'),
                        ),
                        TextButton(
                          onPressed: () =>
                              Navigator.of(ctx).pop(pwController.text),
                          child: const Text('Cambiar'),
                        ),
                      ],
                    );
                  },
                );
                if (result != null && result.isNotEmpty) {
                  _isChangingPassword = true;
                  context.read<ProfileBloc>().add(
                    ProfileChangePasswordRequested(result),
                  );
                }
              },
              icon: const Icon(Icons.lock_outline, size: 16),
              label: const Text('Cambiar contraseña'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOrganizationSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'ORGANIZACIÓN',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 8),
        ColoredBox(
          color: Colors.white,
          child: ListTile(
            onTap: () => context.go('/settings/organization'),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.business, color: Colors.blue),
            ),
            title: const Text('Constructora Demo S.A.'),
            subtitle: const Text('Plan Professional'),
            trailing: const Icon(
              Icons.chevron_right,
              color: AppColors.textHint,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'PREFERENCIAS',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 8),
        ColoredBox(
          color: Colors.white,
          child: Column(
            children: [
              SwitchListTile(
                value: true,
                onChanged: (val) {
                  // TODO(developer): Toggle notifications
                },
                title: const Text('Notificaciones push'),
                secondary: const Icon(
                  Icons.notifications_outlined,
                  color: AppColors.textPrimary,
                ),
                activeThumbColor: AppColors.primary,
              ),
              const Divider(height: 1, indent: 56),
              ListTile(
                leading: const Icon(
                  Icons.dark_mode_outlined,
                  color: AppColors.textPrimary,
                ),
                title: const Text('Tema'),
                trailing: const Text(
                  'Sistema',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                onTap: () {
                  // TODO(developer): Change theme
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: OutlinedButton.icon(
        onPressed: () {
          // Reset profile state then logout
          context.read<ProfileBloc>().add(ProfileReset());
          context.read<AuthBloc>().add(AuthLogoutRequested());
        },
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: const BorderSide(color: AppColors.error),
          minimumSize: const Size(double.infinity, 48),
        ),
        icon: const Icon(Icons.logout),
        label: const Text('Cerrar Sesión'),
      ),
    );
  }

  Widget _buildSyncSection(BuildContext context) {
    // Mock sync data
    const pendingItems = 3;
    const lastSync = 'Hace 5 min';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.sync, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Cola de Sincronización',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  '$pendingItems pendientes • Última sync: $lastSync',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text('Sincronizar'),
          ),
        ],
      ),
    );
  }

  Widget _buildSecuritySection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'SEGURIDAD',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 8),
        ColoredBox(
          color: Colors.white,
          child: ListTile(
            leading: const Icon(
              Icons.lock_outline,
              color: AppColors.textPrimary,
            ),
            title: const Text('Cambiar contraseña'),
            trailing: const Icon(
              Icons.chevron_right,
              color: AppColors.textHint,
            ),
            onTap: () {
              // TODO(developer): Change password flow
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Función próximamente')),
              );
            },
          ),
        ),
      ],
    );
  }
}
