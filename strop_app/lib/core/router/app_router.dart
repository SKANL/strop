// App Router - go_router configuration with StatefulShellRoute
// lib/core/router/app_router.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:strop_app/presentation/auth/pages/login_page.dart';
import 'package:strop_app/presentation/auth/pages/register_page.dart';
import 'package:strop_app/presentation/auth/pages/forgot_password_page.dart';
import 'package:strop_app/presentation/home/pages/home_page.dart';
import 'package:strop_app/presentation/incidents/pages/create_incident_page.dart';
import 'package:strop_app/presentation/incidents/pages/incident_detail_page.dart';
import 'package:strop_app/presentation/profile/pages/organization_page.dart';
import 'package:strop_app/presentation/profile/pages/profile_page.dart';
import 'package:strop_app/presentation/profile/pages/users_page.dart';
import 'package:strop_app/presentation/projects/pages/project_detail_page.dart';
import 'package:strop_app/presentation/projects/pages/projects_list_page.dart';
import 'package:strop_app/presentation/shell/pages/main_shell_page.dart';
import 'package:strop_app/presentation/tasks/pages/tasks_page.dart';
import 'package:strop_app/presentation/notifications/pages/notifications_page.dart';

/// App router configuration following DEVELOPMENT_RULES.md go_router patterns
class AppRouter {
  AppRouter._();

  static final GlobalKey<NavigatorState> _rootNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'root');

  /// Main router instance
  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    debugLogDiagnostics: true,
    routes: [
      // Auth routes (outside shell)
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),

      // Main app shell with bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellPage(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                name: 'home',
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),

          // Branch 1: Projects
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/projects',
                name: 'projects',
                builder: (context, state) => const ProjectsListPage(),
                routes: [
                  GoRoute(
                    path: ':projectId',
                    name: 'project-detail',
                    builder: (context, state) {
                      final projectId = state.pathParameters['projectId']!;
                      return ProjectDetailPage(projectId: projectId);
                    },
                    routes: [
                      // Create incident within project context
                      GoRoute(
                        path: 'create-incident',
                        name: 'create-incident',
                        builder: (context, state) {
                          final projectId = state.pathParameters['projectId']!;
                          final type = state.uri.queryParameters['type'];
                          return CreateIncidentPage(
                            projectId: projectId,
                            incidentType: type,
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),

          // Branch 2: My Tasks
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/tasks',
                name: 'tasks',
                builder: (context, state) => const TasksPage(),
              ),
            ],
          ),

          // Branch 3: Settings/Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                name: 'settings',
                builder: (context, state) => const ProfilePage(),
                routes: [
                  GoRoute(
                    path: 'organization',
                    name: 'organization',
                    builder: (context, state) => const OrganizationPage(),
                    routes: [
                      GoRoute(
                        path: 'users',
                        name: 'organization-users',
                        builder: (context, state) => const UsersPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'notifications',
                    name: 'notifications',
                    builder: (context, state) => const NotificationsPage(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),

      // Incident detail (full screen, outside shell)
      GoRoute(
        path: '/incident/:incidentId',
        name: 'incident-detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final incidentId = state.pathParameters['incidentId']!;
          return IncidentDetailPage(incidentId: incidentId);
        },
      ),
    ],

    // Error handling
    errorBuilder: (context, state) => _ErrorPage(error: state.error),
  );
}

/// Error page for navigation errors
class _ErrorPage extends StatelessWidget {
  const _ErrorPage({this.error});

  final Exception? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text('Error de navegación'),
            const SizedBox(height: 8),
            Text(error?.toString() ?? 'Ruta no encontrada'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Ir al inicio'),
            ),
          ],
        ),
      ),
    );
  }
}
