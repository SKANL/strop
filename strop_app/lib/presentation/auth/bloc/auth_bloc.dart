import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

import 'package:logger/logger.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;
  final Logger _logger = Logger();

  AuthBloc({required this.authRepository}) : super(AuthState.initial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthState.loading());
    try {
      _logger.d('AuthBloc: Login requested for ${event.email}');
      final user = await authRepository.login(event.email, event.password);
      emit(AuthState.authenticated(user));
    } catch (e) {
      _logger.e('AuthBloc: Login failed', error: e);
      emit(AuthState.failure(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthState.loading());
    try {
      _logger.d('AuthBloc: Register requested for ${event.email}');
      await authRepository.register(
        email: event.email,
        password: event.password,
        fullName: event.fullName,
      );

      _logger.d('AuthBloc: Registration successful, attempting auto-login');
      final user = await authRepository.login(event.email, event.password);
      emit(AuthState.authenticated(user));
    } catch (e) {
      _logger.e('AuthBloc: Registration failed', error: e);
      emit(AuthState.failure(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await authRepository.logout();
    emit(AuthState.unauthenticated());
  }
}
