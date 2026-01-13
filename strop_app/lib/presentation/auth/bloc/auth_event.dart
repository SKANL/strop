import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({required this.email, required this.password});

  @override
  List<Object> get props => [email, password];
}

class AuthRegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String fullName;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.fullName,
  });

  @override
  List<Object> get props => [email, password, fullName];
}

class AuthLogoutRequested extends AuthEvent {}
