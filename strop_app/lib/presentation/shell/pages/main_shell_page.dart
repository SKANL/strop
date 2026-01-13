// Main Shell Page - Bottom Navigation with FAB
// lib/presentation/shell/pages/main_shell_page.dart
//
// Replicates original app pattern:
// - BottomAppBar with CircularNotchedRectangle
// - Centered FAB that triggers project selector
// - NavigationRail for tablets (>600dp)

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/presentation/shell/widgets/project_selector_bottom_sheet.dart';

/// Main shell with navigation and FAB
/// Following original app MainShellScreen pattern
class MainShellPage extends StatelessWidget {
  const MainShellPage({
    required this.navigationShell,
    super.key,
  });

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final isWideScreen = MediaQuery.of(context).size.width > 600;

    return Scaffold(
      body: isWideScreen
          ? Row(
              children: [
                _buildNavigationRail(context),
                const VerticalDivider(thickness: 1, width: 1),
                Expanded(child: navigationShell),
              ],
            )
          : navigationShell,
      bottomNavigationBar: isWideScreen ? null : _buildBottomAppBar(context),
      floatingActionButton: isWideScreen ? null : _buildFab(context),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  /// Navigation Rail for tablet/desktop
  Widget _buildNavigationRail(BuildContext context) {
    return NavigationRail(
      selectedIndex: navigationShell.currentIndex,
      onDestinationSelected: (index) => _onItemTapped(context, index),
      labelType: NavigationRailLabelType.all,
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: FloatingActionButton(
          onPressed: () => _showProjectSelector(context),
          backgroundColor: AppColors.accent,
          child: const Icon(Icons.add, color: Colors.white),
        ),
      ),
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: Text('Inicio'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.business_outlined),
          selectedIcon: Icon(Icons.business),
          label: Text('Proyectos'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.task_alt_outlined),
          selectedIcon: Icon(Icons.task_alt),
          label: Text('Tareas'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: Text('Perfil'),
        ),
      ],
    );
  }

  /// Bottom App Bar for mobile
  Widget _buildBottomAppBar(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: AppShadows.medium,
      ),
      child: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        color: Colors.transparent,
        elevation: 0,
        height: 80,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              context,
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              label: 'Inicio',
              index: 0,
            ),
            _buildNavItem(
              context,
              icon: Icons.business_outlined,
              activeIcon: Icons.business,
              label: 'Proyectos',
              index: 1,
            ),
            const SizedBox(width: 56), // Space for FAB notch
            _buildNavItem(
              context,
              icon: Icons.task_alt_outlined,
              activeIcon: Icons.task_alt,
              label: 'Tareas',
              index: 2,
            ),
            _buildNavItem(
              context,
              icon: const Icon(Icons.person_outline).icon!,
              activeIcon: Icons.person,
              label: 'Perfil',
              index: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
  }) {
    final isSelected = navigationShell.currentIndex == index;

    return Expanded(
      child: InkWell(
        onTap: () => _onItemTapped(context, index),
        customBorder: const CircleBorder(),
        child: Container(
          // Minimum 48dp touch target per UX.md
          constraints: const BoxConstraints(minHeight: 48, minWidth: 48),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Floating Action Button with accent shadow
  Widget _buildFab(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: AppShadows.fab,
      ),
      child: FloatingActionButton(
        onPressed: () => _showProjectSelector(context),
        elevation: 0, // Shadow handled by container
        backgroundColor: AppColors.accent,
        child: const Icon(Icons.add, color: Colors.white, size: 32),
      ),
    );
  }

  void _onItemTapped(BuildContext context, int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  void _showProjectSelector(BuildContext context) {
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => ProjectSelectorBottomSheet(
          parentContext: context,
        ),
      ),
    );
  }
}
