import 'package:get_it/get_it.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:strop_app/core/constants/api_constants.dart';
import 'package:strop_app/data/repositories/supabase_auth_repository.dart';
import 'package:strop_app/domain/repositories/auth_repository.dart';
import 'package:strop_app/presentation/auth/bloc/auth_bloc.dart';

final sl = GetIt.instance;

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

  // 3. Blocs
  sl.registerFactory(() => AuthBloc(authRepository: sl()));
}
