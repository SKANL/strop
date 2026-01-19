import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart';

// Events
abstract class IncidentDetailEvent extends Equatable {
  const IncidentDetailEvent();
  @override
  List<Object?> get props => [];
}

class LoadIncidentDetail extends IncidentDetailEvent {
  const LoadIncidentDetail(this.incidentId);
  final String incidentId;
  @override
  List<Object?> get props => [incidentId];
}

class AddComment extends IncidentDetailEvent {
  const AddComment(this.incidentId, this.text);
  final String incidentId;
  final String text;
  @override
  List<Object?> get props => [incidentId, text];
}

class LoadComments extends IncidentDetailEvent {
  const LoadComments(this.incidentId);
  final String incidentId;
  @override
  List<Object?> get props => [incidentId];
}

class CloseIncident extends IncidentDetailEvent {
  const CloseIncident(this.incidentId, this.closedNotes);
  final String incidentId;
  final String? closedNotes;
  @override
  List<Object?> get props => [incidentId, closedNotes];
}

class ClearActionError extends IncidentDetailEvent {}

// State
abstract class IncidentDetailState extends Equatable {
  const IncidentDetailState();
  @override
  List<Object?> get props => [];
}

class IncidentDetailInitial extends IncidentDetailState {}

class IncidentDetailLoading extends IncidentDetailState {}

class IncidentDetailLoaded extends IncidentDetailState { // For transient errors (e.g. failed to comment)

  const IncidentDetailLoaded({
    required this.incident,
    this.comments = const [],
    this.isCommentLoading = false,
    this.isClosing = false,
    this.actionError,
  });
  final Incident incident;
  final List<Comment> comments;
  final bool isCommentLoading;
  final bool isClosing;
  final String? actionError;

  IncidentDetailLoaded copyWith({
    Incident? incident,
    List<Comment>? comments,
    bool? isCommentLoading,
    bool? isClosing,
    String? actionError,
  }) {
    return IncidentDetailLoaded(
      incident: incident ?? this.incident,
      comments: comments ?? this.comments,
      isCommentLoading: isCommentLoading ?? this.isCommentLoading,
      isClosing: isClosing ?? this.isClosing,
      actionError:
          actionError, // If null passed, it stays null? No, usually we want to clear it.
      // Helper: if we pass explicit null it clears? copyWith semantic usually ignores null.
      // We'll use a specific logic: if argument is NOT provided, keep old. If provided (even if null? tricky in Dart).
      // Standard copyWith pattern:
      // actionError: actionError ?? this.actionError
      // To allow clearing, we usually use a separate method or nullable wrapper.
      // For simplicity here: I will assume I only set it to a value or I want to clear it.
      // To clear it, I'll pass an empty string and treat it as null, OR I will make the copyWith smarter.
      // Let's settle for: if I pass actionError, it overrides. But Dart copyWith signatures usually mean null = keep.
      // I will add a `clearActionError` boolean flag to copyWith or just implement logic in Bloc.
      // Actually standard way:
    );
  }

  // Custom copyWith to allow clearing nullable fields
  IncidentDetailLoaded copyWithSafely({
    Incident? incident,
    List<Comment>? comments,
    bool? isCommentLoading,
    bool? isClosing,
    String? actionError,
    bool clearActionError = false,
  }) {
    return IncidentDetailLoaded(
      incident: incident ?? this.incident,
      comments: comments ?? this.comments,
      isCommentLoading: isCommentLoading ?? this.isCommentLoading,
      isClosing: isClosing ?? this.isClosing,
      actionError: clearActionError ? null : (actionError ?? this.actionError),
    );
  }

  @override
  List<Object?> get props => [
    incident,
    comments,
    isCommentLoading,
    isClosing,
    actionError,
  ];
}

class IncidentDetailError extends IncidentDetailState {
  const IncidentDetailError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

// Bloc
class IncidentDetailBloc
    extends Bloc<IncidentDetailEvent, IncidentDetailState> {

  IncidentDetailBloc({required IncidentRepository repository})
    : _repository = repository,
      super(IncidentDetailInitial()) {
    on<LoadIncidentDetail>(_onLoadDetail);
    on<LoadComments>(_onLoadComments);
    on<AddComment>(_onAddComment);
    on<CloseIncident>(_onCloseIncident);
    on<ClearActionError>(_onClearActionError);
  }
  final IncidentRepository _repository;

  Future<void> _onLoadDetail(
    LoadIncidentDetail event,
    Emitter<IncidentDetailState> emit,
  ) async {
    emit(IncidentDetailLoading());
    try {
      final incident = await _repository.getIncidentById(event.incidentId);
      if (incident != null) {
        // Initial state with incident loaded
        emit(IncidentDetailLoaded(incident: incident, isCommentLoading: true));
        // Then load comments
        add(LoadComments(event.incidentId));
      } else {
        emit(const IncidentDetailError('Incidencia no encontrada'));
      }
    } catch (e) {
      emit(IncidentDetailError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadComments(
    LoadComments event,
    Emitter<IncidentDetailState> emit,
  ) async {
    if (state is IncidentDetailLoaded) {
      final currentState = state as IncidentDetailLoaded;
      emit(currentState.copyWithSafely(isCommentLoading: true));
      try {
        final comments = await _repository.getComments(event.incidentId);
        emit(
          currentState.copyWithSafely(
            comments: comments,
            isCommentLoading: false,
          ),
        );
      } catch (e) {
        // Fallback: keep previous comments but stop loading
        emit(
          currentState.copyWithSafely(
            isCommentLoading: false,
            actionError: 'No se pudieron cargar los comentarios recientes',
          ),
        );
      }
    }
  }

  Future<void> _onAddComment(
    AddComment event,
    Emitter<IncidentDetailState> emit,
  ) async {
    if (state is IncidentDetailLoaded) {
      final currentState = state as IncidentDetailLoaded;
      emit(
        currentState.copyWithSafely(
          isCommentLoading: true,
          clearActionError: true,
        ),
      );
      try {
        await _repository.addComment(
          incidentId: event.incidentId,
          text: event.text,
        );
        // Reload comments to get full details (server time, author, id)
        add(LoadComments(event.incidentId));
      } catch (e) {
        emit(
          currentState.copyWithSafely(
            isCommentLoading: false,
            actionError: e.toString().replaceAll('Exception: ', ''),
          ),
        );
      }
    }
  }

  Future<void> _onCloseIncident(
    CloseIncident event,
    Emitter<IncidentDetailState> emit,
  ) async {
    if (state is IncidentDetailLoaded) {
      final currentState = state as IncidentDetailLoaded;
      emit(
        currentState.copyWithSafely(isClosing: true, clearActionError: true),
      );
      try {
        await _repository.closeIncident(
          incidentId: event.incidentId,
          closedNotes: event.closedNotes,
        );
        // Refresh incident to get new status
        add(LoadIncidentDetail(event.incidentId));
      } catch (e) {
        emit(
          currentState.copyWithSafely(
            isClosing: false,
            actionError: e.toString().replaceAll('Exception: ', ''),
          ),
        );
      }
    }
  }

  void _onClearActionError(
    ClearActionError event,
    Emitter<IncidentDetailState> emit,
  ) {
    if (state is IncidentDetailLoaded) {
      emit(
        (state as IncidentDetailLoaded).copyWithSafely(clearActionError: true),
      );
    }
  }
}
