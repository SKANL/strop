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
  final String organizationName;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.fullName,
    required this.organizationName,
  });

  @override
  List<Object> get props => [email, password, fullName, organizationName];
}

class AuthLogoutRequested extends AuthEvent {}
