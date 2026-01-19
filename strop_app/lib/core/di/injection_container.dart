import 'package:get_it/get_it.dart';
import 'package:strop_app/core/constants/api_constants.dart';
import 'package:strop_app/data/repositories/mock_incident_repository.dart';
import 'package:strop_app/data/repositories/supabase_auth_repository.dart';
import 'package:strop_app/data/repositories/supabase_profile_repository.dart';
import 'package:strop_app/data/repositories/supabase_project_repository.dart';
import 'package:strop_app/domain/repositories/auth_repository.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';
import 'package:strop_app/domain/repositories/profile_repository.dart';
import 'package:strop_app/domain/repositories/project_repository.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';
import 'package:strop_app/presentation/home/bloc/home_bloc.dart';
import 'package:strop_app/presentation/profile/bloc/profile_bloc.dart';
import 'package:strop_app/presentation/projects/bloc/project_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final GetIt sl = GetIt.instance;

Future<void> init() async {
  // 1. External
  await Supabase.initialize(
    url: ApiConstants.supabaseUrl,
    anonKey: ApiConstants.supabaseAnonKey,
  );

  sl.registerLazySingleton<SupabaseClient>(() => Supabase.instance.client);

  // 2. Repositories
  sl.registerLazySingleton<AuthRepository>(
    () => SupabaseAuthRepository(sl()),
  );
  sl.registerLazySingleton<ProfileRepository>(
    () => SupabaseProfileRepository(sl()),
  );
  sl.registerLazySingleton<ProjectRepository>(
    () => SupabaseProjectRepository(supabase: sl()),
  );
  sl.registerLazySingleton<IncidentRepository>(
    MockIncidentRepository.new,
  );

  // 3. Blocs
  sl.registerFactory(() => AuthBloc(authRepository: sl()));
  sl.registerFactory(() => HomeBloc(incidentRepository: sl()));
  sl.registerFactory(() => ProjectBloc(projectRepository: sl()));
  sl.registerFactory(
    () => ProfileBloc(profileRepository: sl(), authRepository: sl()),
  );
}
