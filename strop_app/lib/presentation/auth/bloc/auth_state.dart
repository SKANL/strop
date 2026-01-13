import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/user.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, failure }

class AuthState extends Equatable {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  factory AuthState.initial() => const AuthState(status: AuthStatus.initial);

  factory AuthState.loading() => const AuthState(status: AuthStatus.loading);

  factory AuthState.authenticated(User user) => AuthState(
    status: AuthStatus.authenticated,
    user: user,
  );

  factory AuthState.unauthenticated() => const AuthState(
    status: AuthStatus.unauthenticated,
  );

  factory AuthState.failure(String message) => AuthState(
    status: AuthStatus.failure,
    errorMessage: message,
  );

  @override
  List<Object?> get props => [status, user, errorMessage];
}
