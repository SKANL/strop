import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/project_repository.dart';

// Events
abstract class ProjectEvent extends Equatable {
  const ProjectEvent();
  @override
  List<Object?> get props => [];
}

class ProjectStarted extends ProjectEvent {}

class ProjectSelected extends ProjectEvent {
  const ProjectSelected(this.project);
  final Project project;
  @override
  List<Object?> get props => [project];
}

// State
abstract class ProjectState extends Equatable {
  const ProjectState();
  @override
  List<Object?> get props => [];
}

class ProjectInitial extends ProjectState {}

class ProjectLoading extends ProjectState {}

class ProjectLoaded extends ProjectState {

  const ProjectLoaded({
    required this.projects,
    this.selectedProject,
  });
  final List<Project> projects;
  final Project? selectedProject;

  ProjectLoaded copyWith({
    List<Project>? projects,
    Project? selectedProject,
  }) {
    return ProjectLoaded(
      projects: projects ?? this.projects,
      selectedProject: selectedProject ?? this.selectedProject,
    );
  }

  @override
  List<Object?> get props => [projects, selectedProject];
}

class ProjectError extends ProjectState {
  const ProjectError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

// Bloc
class ProjectBloc extends Bloc<ProjectEvent, ProjectState> {

  ProjectBloc({required ProjectRepository projectRepository})
    : _projectRepository = projectRepository,
      super(ProjectInitial()) {
    on<ProjectStarted>(_onStarted);
    on<ProjectSelected>(_onSelected);
  }
  final ProjectRepository _projectRepository;

  Future<void> _onStarted(
    ProjectStarted event,
    Emitter<ProjectState> emit,
  ) async {
    emit(ProjectLoading());
    try {
      final projects = await _projectRepository.getProjects();

      // Select first active project by default if available
      final initialProject = projects.isNotEmpty ? projects.first : null;

      emit(
        ProjectLoaded(
          projects: projects,
          selectedProject: initialProject,
        ),
      );
    } catch (e) {
      emit(ProjectError(e.toString()));
    }
  }

  void _onSelected(ProjectSelected event, Emitter<ProjectState> emit) {
    if (state is ProjectLoaded) {
      final currentState = state as ProjectLoaded;
      emit(currentState.copyWith(selectedProject: event.project));
    }
  }
}
