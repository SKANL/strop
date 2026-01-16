import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/user.dart';

abstract class ProfileState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class ProfileLoaded extends ProfileState {
  final User user;
  ProfileLoaded(this.user);

  @override
  List<Object?> get props => [user];
}

class ProfileFailure extends ProfileState {
  final String message;
  ProfileFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class ProfilePasswordChangeSuccess extends ProfileState {
  final String message;
  ProfilePasswordChangeSuccess([
    this.message = 'Contraseña actualizada correctamente',
  ]);

  @override
  List<Object?> get props => [message];
}
