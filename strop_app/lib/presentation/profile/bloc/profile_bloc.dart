import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/auth_repository.dart';
import 'package:strop_app/domain/repositories/profile_repository.dart';

part 'profile_event.dart';
part 'profile_state.dart';

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {

  ProfileBloc({
    required ProfileRepository profileRepository,
    required AuthRepository authRepository,
  }) : _profileRepository = profileRepository,
       _authRepository = authRepository,
       super(const ProfileState()) {
    on<LoadProfile>(_onLoadProfile);
    on<RefreshProfile>(_onRefreshProfile);
    // on<UpdateProfile>(_onUpdateProfile);
    on<LogoutRequested>(_onLogoutRequested);
  }
  final ProfileRepository _profileRepository;
  final AuthRepository _authRepository;

  Future<void> _onLoadProfile(
    LoadProfile event,
    Emitter<ProfileState> emit,
  ) async {
    emit(state.copyWith(status: ProfileStatus.loading));
    try {
      // But repo method signature is specific.

      // Get the current authenticated user from AuthRepository
      final currentUser = await _authRepository.getCurrentUser();

      if (currentUser == null) {
        emit(
          state.copyWith(
            status: ProfileStatus.error,
            errorMessage: 'No hay sesión activa. Por favor inicia sesión.',
          ),
        );
        return;
      }

      final userId = currentUser.id;
      final user = await _profileRepository.getMyProfile(userId);

      if (user != null) {
        emit(state.copyWith(status: ProfileStatus.loaded, user: user));
      } else {
        emit(
          state.copyWith(
            status: ProfileStatus.error,
            errorMessage: 'Usuario no encontrado',
          ),
        );
      }
    } catch (e) {
      emit(
        state.copyWith(status: ProfileStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onRefreshProfile(
    RefreshProfile event,
    Emitter<ProfileState> emit,
  ) async {
    // Similar to Load but keep content while loading?
    add(LoadProfile());
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<ProfileState> emit,
  ) async {
    try {
      await _authRepository.logout();
      // Emitting loggedOut status to trigger navigation
      emit(state.copyWith(status: ProfileStatus.loggedOut));
    } catch (e) {
      emit(state.copyWith(errorMessage: 'Error al cerrar sesión: $e'));
    }
  }
}
