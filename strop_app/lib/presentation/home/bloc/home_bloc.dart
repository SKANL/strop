import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';
import 'package:strop_app/domain/repositories/project_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart'; // For User access or pass via AuthBloc

// Events
abstract class HomeEvent extends Equatable {
  const HomeEvent();
  @override
  List<Object?> get props => [];
}

class HomeStarted extends HomeEvent {}

class HomeRefreshed extends HomeEvent {}

// State
abstract class HomeState extends Equatable {
  const HomeState();
  @override
  List<Object?> get props => [];
}

class HomeInitial extends HomeState {}

class HomeLoading extends HomeState {}

class HomeLoaded extends HomeState {
  final Map<String, int> summaryStats;
  final List<Incident> recentActivity;
  // User is usually accessed via AuthBloc, or we can include it here if Home manages Profile specifics

  const HomeLoaded({
    required this.summaryStats,
    required this.recentActivity,
  });

  @override
  List<Object?> get props => [summaryStats, recentActivity];
}

class HomeError extends HomeState {
  final String message;
  const HomeError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final IncidentRepository _incidentRepository;

  HomeBloc({
    required IncidentRepository incidentRepository,
  }) : _incidentRepository = incidentRepository,
       super(HomeInitial()) {
    on<HomeStarted>(_onStarted);
    on<HomeRefreshed>(_onRefreshed);
  }

  Future<void> _onStarted(HomeStarted event, Emitter<HomeState> emit) async {
    await _loadData(emit);
  }

  Future<void> _onRefreshed(
    HomeRefreshed event,
    Emitter<HomeState> emit,
  ) async {
    await _loadData(emit);
  }

  Future<void> _loadData(Emitter<HomeState> emit) async {
    emit(HomeLoading());
    try {
      final stats = await _incidentRepository.getDashboardStats();
      final recent = await _incidentRepository.getIncidents(limit: 5);

      emit(
        HomeLoaded(
          summaryStats: stats,
          recentActivity: recent,
        ),
      );
    } catch (e) {
      emit(HomeError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
