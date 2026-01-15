import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';
import 'package:strop_app/core/utils/logger.dart';

// Events
abstract class CreateIncidentEvent extends Equatable {
  const CreateIncidentEvent();
  @override
  List<Object?> get props => [];
}

class CreateIncidentSubmitted extends CreateIncidentEvent {
  final String projectId;
  final String title;
  final String description;
  final String incidentType;
  final String priority;
  final String? location;
  final List<String> photoPaths;

  const CreateIncidentSubmitted({
    required this.projectId,
    required this.title,
    required this.description,
    required this.incidentType,
    required this.priority,
    this.location,
    this.photoPaths = const [],
  });

  @override
  List<Object?> get props => [
    projectId,
    title,
    description,
    incidentType,
    priority,
    location,
    photoPaths,
  ];
}

// State
abstract class CreateIncidentState extends Equatable {
  const CreateIncidentState();
  @override
  List<Object?> get props => [];
}

class CreateIncidentInitial extends CreateIncidentState {}

class CreateIncidentLoading extends CreateIncidentState {}

class CreateIncidentSuccess extends CreateIncidentState {
  final String incidentId;
  final String? warningMessage;

  const CreateIncidentSuccess({required this.incidentId, this.warningMessage});

  @override
  List<Object?> get props => [incidentId, warningMessage];
}

class CreateIncidentFailure extends CreateIncidentState {
  final String message;
  const CreateIncidentFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class CreateIncidentBloc
    extends Bloc<CreateIncidentEvent, CreateIncidentState> {
  final IncidentRepository _incidentRepository;

  CreateIncidentBloc({
    required IncidentRepository incidentRepository,
  }) : _incidentRepository = incidentRepository,
       super(CreateIncidentInitial()) {
    on<CreateIncidentSubmitted>(_onSubmitted);
  }

  Future<void> _onSubmitted(
    CreateIncidentSubmitted event,
    Emitter<CreateIncidentState> emit,
  ) async {
    emit(CreateIncidentLoading());
    try {
      // 1. Create Incident (RPC)
      final incidentId = await _incidentRepository.createIncident(
        projectId: event.projectId,
        title: event.title,
        description: event.description,
        incidentType: event.incidentType,
        priority: event.priority,
        location: event.location,
      );

      // 2. Upload Photos (if any)
      int failedPhotos = 0;
      if (event.photoPaths.isNotEmpty) {
        for (final path in event.photoPaths) {
          try {
            final fileName = path.split('/').last; // Simple filename extraction
            await _incidentRepository.uploadPhoto(
              incidentId: incidentId,
              filePath: path,
              fileName: fileName,
            );
          } catch (e) {
            logger.e('Failed to upload photo $path', error: e);
            failedPhotos++;
          }
        }
      }

      // 3. Emit Success
      if (failedPhotos > 0) {
        emit(
          CreateIncidentSuccess(
            incidentId: incidentId,
            warningMessage:
                'Se creó la incidencia, pero fallaron $failedPhotos fotos.',
          ),
        );
      } else {
        emit(CreateIncidentSuccess(incidentId: incidentId));
      }
    } catch (e) {
      emit(CreateIncidentFailure(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
