import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/core/di/injection_container.dart';
import 'package:strop_app/core/router/app_router.dart';
import 'package:strop_app/core/theme/app_theme.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';
import 'package:strop_app/presentation/auth/bloc/auth_event.dart';
import 'package:strop_app/presentation/projects/bloc/project_bloc.dart';
import 'package:strop_app/presentation/home/bloc/home_bloc.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) =>
              sl<AuthBloc>()..add(AuthCheckRequested()), // Injected via GetIt
        ),
        BlocProvider<ProjectBloc>(
          create: (_) => sl<ProjectBloc>()..add(ProjectStarted()),
        ),
        BlocProvider<HomeBloc>(
          create: (_) => sl<HomeBloc>()..add(HomeStarted()),
        ),
      ],
      child: const AppView(),
    );
  }
}

class AppView extends StatelessWidget {
  const AppView({super.key});

  @override
  Widget build(BuildContext context) {
    // Assuming AppTheme.light is defined in app_theme.dart based on previous reads
    return MaterialApp.router(
      routerConfig: AppRouter.router,
      theme: AppTheme.light,
      // darkTheme: AppTheme.dark, // Uncomment when dark theme is ready
      themeMode: ThemeMode.light, // Forcing light for MVP consistency
      debugShowCheckedModeBanner: false,
      title: 'STROP',
    );
  }
}
