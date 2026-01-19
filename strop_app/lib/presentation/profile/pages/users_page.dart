import 'package:flutter/material.dart';
import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/data/datasources/local/mock_data.dart';
import 'package:strop_app/domain/entities/entities.dart';

class UsersPage extends StatelessWidget {
  const UsersPage({super.key});

  @override
  Widget build(BuildContext context) {
    // In a real app, we would filter by organization ID
    final users = MockDataService.mockUsers;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Usuarios'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invitar usuario (Mock)')),
          );
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Invitar'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: users.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final user = users[index];
          return _UserCard(user: user);
        },
      ),
    );
  }
}

class _UserCard extends StatelessWidget {

  const _UserCard({required this.user});
  final User user;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: AppColors.getRoleColor(
            user.role?.name ?? '',
          ).withValues(alpha: 0.2),
          child: Text(
            user.initials,
            style: TextStyle(
              color: AppColors.getRoleColor(user.role?.name ?? ''),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          user.fullName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user.email),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.getRoleColor(
                  user.role?.name ?? '',
                ).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                user.role?.displayName ?? 'Sin Rol',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.getRoleColor(user.role?.name ?? ''),
                ),
              ),
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () {
            // Edit user options
          },
        ),
      ),
    );
  }
}
