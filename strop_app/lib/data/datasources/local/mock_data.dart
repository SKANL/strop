// Mock Data Service - Development Data
// lib/data/datasources/local/mock_data.dart
//
// Provides realistic mock data matching Supabase schema for UI development
// ignore_for_file: lines_longer_than_80_chars

import 'package:strop_app/domain/entities/entities.dart';

/// Mock data service for UI development without Supabase connection
class MockDataService {
  // ===========================================
  // MOCK ORGANIZATION
  // ===========================================

  static const String mockOrgId = 'org-001-mock';

  static Organization get mockOrganization => Organization(
    id: mockOrgId,
    name: 'Constructora STROP Demo',
    slug: 'strop-demo',
    billingEmail: 'admin@strop-demo.com',
    plan: SubscriptionPlan.professional,
    createdAt: DateTime.now().subtract(const Duration(days: 365)),
  );

  // ===========================================
  // MOCK USERS
  // ===========================================

  static User get currentUser => const User(
    id: 'user-001',
    authId: 'auth-001',
    currentOrganizationId: mockOrgId,
    email: 'carlos.martinez@strop-demo.com',
    fullName: 'Carlos Martínez',
    role: UserRole.resident,
  );

  static List<User> get mockUsers => [
    currentUser,
    const User(
      id: 'user-002',
      email: 'ana.garcia@strop-demo.com',
      fullName: 'Ana García',
      role: UserRole.superintendent,
    ),
    const User(
      id: 'user-003',
      email: 'luis.hernandez@strop-demo.com',
      fullName: 'Luis Hernández',
      role: UserRole.cabo,
    ),
    const User(
      id: 'user-004',
      email: 'maria.lopez@strop-demo.com',
      fullName: 'María López',
      role: UserRole.owner,
    ),
    const User(
      id: 'user-005',
      email: 'pedro.sanchez@strop-demo.com',
      fullName: 'Pedro Sánchez',
      role: UserRole.cabo,
    ),
  ];

  // ===========================================
  // MOCK PROJECTS
  // ===========================================

  static List<Project> get mockProjects => [
    Project(
      id: 'proj-001',
      organizationId: mockOrgId,
      name: 'Torre Residencial Norte',
      location: 'Av. Reforma 500, CDMX',
      startDate: DateTime.now().subtract(const Duration(days: 120)),
      endDate: DateTime.now().add(const Duration(days: 180)),
      ownerId: 'user-004',
      owner: mockUsers.firstWhere((u) => u.id == 'user-004'),
      memberCount: 12,
      openIncidentsCount: 5,
    ),
    Project(
      id: 'proj-002',
      organizationId: mockOrgId,
      name: 'Centro Comercial Plaza Sur',
      location: 'Blvd. Insurgentes 1200, CDMX',
      startDate: DateTime.now().subtract(const Duration(days: 60)),
      endDate: DateTime.now().add(const Duration(days: 300)),
      ownerId: 'user-004',
      memberCount: 8,
      openIncidentsCount: 3,
    ),
    Project(
      id: 'proj-003',
      organizationId: mockOrgId,
      name: 'Nave Industrial Querétaro',
      location: 'Parque Industrial El Marqués, QRO',
      startDate: DateTime.now().subtract(const Duration(days: 200)),
      endDate: DateTime.now().add(const Duration(days: 60)),
      ownerId: 'user-004',
      memberCount: 6,
      openIncidentsCount: 2,
    ),
    Project(
      id: 'proj-004',
      organizationId: mockOrgId,
      name: 'Residencial Los Pinos',
      location: 'Colonia Condesa, CDMX',
      startDate: DateTime.now().subtract(const Duration(days: 400)),
      endDate: DateTime.now().subtract(const Duration(days: 30)),
      status: ProjectStatus.completed,
      ownerId: 'user-004',
      memberCount: 5,
    ),
  ];

  /// Get only active projects
  static List<Project> get activeProjects =>
      mockProjects.where((p) => p.status == ProjectStatus.active).toList();

  // ===========================================
  // MOCK INCIDENTS
  // ===========================================

  static List<Incident> get mockIncidents => [
    Incident(
      id: 'inc-001',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Grieta en muro de carga piso 5',
      description:
          'Se detectó una grieta diagonal de aproximadamente 2m en el muro de carga del nivel 5, sector norte.',
      location: 'Piso 5, Sector Norte',
      priority: IncidentPriority.critical,
      createdById: 'user-001',
      createdBy: currentUser,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      photoUrls: const ['photo1.jpg', 'photo2.jpg'],
      commentsCount: 3,
    ),
    Incident(
      id: 'inc-002',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.orderInstruction,
      title: 'Instrucción: Cambio de especificación acero',
      description:
          'Por instrucción del ingeniero estructural, se cambia la especificación del acero de refuerzo en columnas C12-C18.',
      location: 'Nivel 3-6',
      status: IncidentStatus.assigned,
      createdById: 'user-002',
      createdBy: mockUsers[1],
      assignedToId: 'user-001',
      assignedTo: currentUser,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      photoUrls: const ['spec_change.pdf'],
      commentsCount: 5,
    ),
    Incident(
      id: 'inc-003',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.requestQuery,
      title: 'Consulta sobre ubicación de ductos HVAC',
      description:
          'Se requiere confirmación de la ubicación exacta de los ductos de aire acondicionado en el área de lobby.',
      location: 'Lobby principal',
      createdById: 'user-003',
      createdBy: mockUsers[2],
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      commentsCount: 1,
    ),
    Incident(
      id: 'inc-004',
      organizationId: mockOrgId,
      projectId: 'proj-002',
      type: IncidentType.certification,
      title: 'Certificación de instalación eléctrica nivel 2',
      description:
          'Se solicita certificación de la instalación eléctrica completada en el nivel 2 del centro comercial.',
      location: 'Nivel 2 completo',
      status: IncidentStatus.closed,
      createdById: 'user-001',
      createdBy: currentUser,
      closedById: 'user-002',
      closedBy: mockUsers[1],
      closedAt: DateTime.now().subtract(const Duration(hours: 12)),
      closedNotes: 'Instalación certificada. Cumple con NOM-001-SEDE.',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      photoUrls: const ['cert_electrical.jpg'],
      commentsCount: 8,
    ),
    Incident(
      id: 'inc-005',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Fuga de agua en tubería principal',
      description:
          'Se detectó fuga en la tubería principal de agua potable en el sótano 1.',
      location: 'Sótano 1, cuarto de bombas',
      priority: IncidentPriority.critical,
      status: IncidentStatus.assigned,
      createdById: 'user-003',
      createdBy: mockUsers[2],
      assignedToId: 'user-001',
      assignedTo: currentUser,
      createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
      photoUrls: const ['leak1.jpg', 'leak2.jpg', 'leak3.jpg'],
      commentsCount: 2,
    ),
  ];

  /// Get incidents for a project
  static List<Incident> getIncidentsForProject(String projectId) =>
      mockIncidents.where((i) => i.projectId == projectId).toList();

  /// Get open incidents
  static List<Incident> get openIncidents =>
      mockIncidents.where((i) => i.status != IncidentStatus.closed).toList();

  /// Get critical incidents
  static List<Incident> get criticalIncidents => mockIncidents
      .where(
        (i) =>
            i.priority == IncidentPriority.critical &&
            i.status != IncidentStatus.closed,
      )
      .toList();

  /// Get incidents assigned to current user
  static List<Incident> get myAssignedIncidents =>
      mockIncidents.where((i) => i.assignedToId == currentUser.id).toList();

  /// Get incidents created by current user
  static List<Incident> get myCreatedIncidents =>
      mockIncidents.where((i) => i.createdById == currentUser.id).toList();

  // ===========================================
  // MOCK COMMENTS
  // ===========================================

  static List<Comment> getCommentsForIncident(String incidentId) => [
    Comment(
      id: 'comment-001',
      incidentId: incidentId,
      text: 'He asignado a un equipo para revisar esto inmediatamente.',
      authorId: 'user-002',
      author: mockUsers[1],
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    Comment(
      id: 'comment-002',
      incidentId: incidentId,
      text: 'Entendido, estamos en camino.',
      authorId: 'user-001',
      author: currentUser,
      createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
    ),
    Comment(
      id: 'comment-003',
      incidentId: incidentId,
      text: 'Llegamos al sitio. Evaluando la situación.',
      authorId: 'user-003',
      author: mockUsers[2],
      createdAt: DateTime.now().subtract(const Duration(minutes: 20)),
    ),
  ];

  // ===========================================
  // HOME SCREEN DATA
  // ===========================================

  /// Get today's task summary for current user
  static Map<String, int> get todaySummary => {
    'pendingTasks': myAssignedIncidents
        .where((i) => i.status != IncidentStatus.closed)
        .length,
    'criticalTasks': myAssignedIncidents
        .where(
          (i) =>
              i.priority == IncidentPriority.critical &&
              i.status != IncidentStatus.closed,
        )
        .length,
    'completedToday': 2,
    'totalProjects': activeProjects.length,
  };

  /// Get recent activity for home feed
  static List<Map<String, dynamic>> get recentActivity => [
    {
      'type': 'incident_created',
      'incident': mockIncidents[0],
      'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
    },
    {
      'type': 'comment_added',
      'incidentId': 'inc-002',
      'comment': 'Nuevo comentario agregado',
      'timestamp': DateTime.now().subtract(const Duration(hours: 3)),
    },
    {
      'type': 'incident_assigned',
      'incident': mockIncidents[4],
      'timestamp': DateTime.now().subtract(const Duration(minutes: 30)),
    },
    {
      'type': 'incident_closed',
      'incident': mockIncidents[3],
      'timestamp': DateTime.now().subtract(const Duration(hours: 12)),
    },
  ];
}
