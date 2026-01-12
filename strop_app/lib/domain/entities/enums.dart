// Domain Entities - Enums matching Supabase schema
// lib/domain/entities/enums.dart

/// User roles in the organization - matches user_role ENUM
enum UserRole {
  owner,
  superintendent,
  resident,
  cabo;

  String get displayName {
    switch (this) {
      case UserRole.owner:
        return 'Propietario';
      case UserRole.superintendent:
        return 'Superintendente';
      case UserRole.resident:
        return 'Residente';
      case UserRole.cabo:
        return 'Cabo';
    }
  }
}

/// Project status - matches project_status ENUM
enum ProjectStatus {
  active,
  paused,
  completed;

  String get displayName {
    switch (this) {
      case ProjectStatus.active:
        return 'Activo';
      case ProjectStatus.paused:
        return 'Pausado';
      case ProjectStatus.completed:
        return 'Completado';
    }
  }
}

/// Project roles - matches project_role ENUM
enum ProjectRole {
  superintendent,
  resident,
  cabo;

  String get displayName {
    switch (this) {
      case ProjectRole.superintendent:
        return 'Superintendente';
      case ProjectRole.resident:
        return 'Residente';
      case ProjectRole.cabo:
        return 'Cabo';
    }
  }
}

/// Incident types - matches incident_type ENUM
enum IncidentType {
  orderInstruction,
  requestQuery,
  certification,
  incidentNotification;

  String get displayName {
    switch (this) {
      case IncidentType.orderInstruction:
        return 'Orden/Instrucción';
      case IncidentType.requestQuery:
        return 'Solicitud/Consulta';
      case IncidentType.certification:
        return 'Certificación';
      case IncidentType.incidentNotification:
        return 'Notificación de Incidente';
    }
  }

  /// Map from SQL ENUM string to dart enum
  static IncidentType fromString(String value) {
    switch (value.toUpperCase()) {
      case 'ORDER_INSTRUCTION':
        return IncidentType.orderInstruction;
      case 'REQUEST_QUERY':
        return IncidentType.requestQuery;
      case 'CERTIFICATION':
        return IncidentType.certification;
      case 'INCIDENT_NOTIFICATION':
        return IncidentType.incidentNotification;
      default:
        return IncidentType.incidentNotification;
    }
  }
}

/// Incident priority - matches incident_priority ENUM
enum IncidentPriority {
  normal,
  critical;

  String get displayName {
    switch (this) {
      case IncidentPriority.normal:
        return 'Normal';
      case IncidentPriority.critical:
        return 'Crítica';
    }
  }
}

/// Incident status - matches incident_status ENUM
enum IncidentStatus {
  open,
  assigned,
  closed;

  String get displayName {
    switch (this) {
      case IncidentStatus.open:
        return 'Abierto';
      case IncidentStatus.assigned:
        return 'Asignado';
      case IncidentStatus.closed:
        return 'Cerrado';
    }
  }
}

/// Subscription plans
enum SubscriptionPlan { starter, professional, enterprise }

/// Event source for bitacora entries
enum EventSource { incident, manual, mobile, system }
