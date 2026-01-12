// Main App Entry Point
// lib/app/app.dart

import 'package:flutter/material.dart';

import 'package:strop_app/core/router/app_router.dart';
import 'package:strop_app/core/theme/app_theme.dart';

/// Main application widget
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'STROP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.light,
      routerConfig: AppRouter.router,
    );
  }
}
