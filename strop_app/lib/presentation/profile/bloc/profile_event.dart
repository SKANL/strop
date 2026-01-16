import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/user.dart';

abstract class ProfileEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class ProfileLoadRequested extends ProfileEvent {
  final String userId;
  ProfileLoadRequested(this.userId);

  @override
  List<Object?> get props => [userId];
}

class ProfileUpdateRequested extends ProfileEvent {
  final User user;
  ProfileUpdateRequested(this.user);

  @override
  List<Object?> get props => [user];
}

class ProfileChangePasswordRequested extends ProfileEvent {
  final String newPassword;
  ProfileChangePasswordRequested(this.newPassword);

  @override
  List<Object?> get props => [newPassword];
}

class ProfileReset extends ProfileEvent {}
