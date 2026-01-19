part of 'profile_bloc.dart';

abstract class ProfileEvent extends Equatable {
  const ProfileEvent();

  @override
  List<Object?> get props => [];
}

class LoadProfile extends ProfileEvent {}

class RefreshProfile extends ProfileEvent {}

class UpdateProfile extends ProfileEvent {

  const UpdateProfile(this.user);
  final User user;

  @override
  List<Object?> get props => [user];
}

class LogoutRequested extends ProfileEvent {}
