import 'package:bloc/bloc.dart';
import 'package:logger/logger.dart';
import 'package:strop_app/domain/repositories/profile_repository.dart';
import 'profile_event.dart';
import 'profile_state.dart';

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final ProfileRepository profileRepository;
  final Logger _logger = Logger();

  ProfileBloc({required this.profileRepository}) : super(ProfileInitial()) {
    on<ProfileLoadRequested>(_onLoad);
    on<ProfileUpdateRequested>(_onUpdate);
    on<ProfileChangePasswordRequested>(_onChangePassword);
    on<ProfileReset>((event, emit) => emit(ProfileInitial()));
  }

  Future<void> _onLoad(
    ProfileLoadRequested event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final user = await profileRepository.getMyProfile(event.userId);
      if (user == null) {
        emit(ProfileFailure('Perfil no encontrado'));
      } else {
        emit(ProfileLoaded(user));
      }
    } catch (e) {
      _logger.e('Error loading profile', error: e);
      emit(ProfileFailure(e.toString()));
    }
  }

  Future<void> _onUpdate(
    ProfileUpdateRequested event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      // updateProfile now returns the updated user directly (no extra SELECT needed)
      final updatedUser = await profileRepository.updateProfile(event.user);
      emit(ProfileLoaded(updatedUser));
    } catch (e) {
      _logger.e('Error updating profile', error: e);
      emit(ProfileFailure(e.toString()));
    }
  }

  Future<void> _onChangePassword(
    ProfileChangePasswordRequested event,
    Emitter<ProfileState> emit,
  ) async {
    try {
      await profileRepository.changePassword(event.newPassword);
      emit(ProfilePasswordChangeSuccess());
    } catch (e) {
      _logger.e('Error changing password', error: e);
      emit(ProfileFailure(e.toString()));
    }
  }
}
