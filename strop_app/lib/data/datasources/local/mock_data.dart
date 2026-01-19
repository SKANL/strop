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

  // ===========================================
  // MOCK INCIDENTS
  // ===========================================

  static List<Incident> get mockIncidents => [
    // CRITICAL INCIDENTS (High Priority)
    Incident(
      id: 'inc-001',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Grieta estructural en muro de carga',
      description:
          'Se detectó una fisura diagonal de 3mm de espesor en el eje 4, muro de contención norte. Requiere evaluación inmediata del calculista.',
      location: 'Sótano 2, Eje 4',
      priority: IncidentPriority.critical,
      createdById: 'user-002', // Superintendent
      createdBy: mockUsers[1],
      createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      photoUrls: const ['crack_detail_1.jpg', 'crack_detail_2.jpg'],
      commentsCount: 2,
    ),
    Incident(
      id: 'inc-002',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Fuga de agua en losa de entrepiso',
      description:
          'Filtración activa en la losa del nivel 3, afectando plafones del nivel inferior. Posible ruptura de tubería hidráulica.',
      location: 'Nivel 3, Área de Baños',
      priority: IncidentPriority.critical,
      status: IncidentStatus.assigned,
      createdById: 'user-003', // Cabo
      createdBy: mockUsers[2],
      assignedToId: 'user-001', // Me (Resident)
      assignedTo: currentUser,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      photoUrls: const ['leak_ceiling.jpg'],
      commentsCount: 5,
    ),

    // ORDERS / INSTRUCTIONS
    Incident(
      id: 'inc-003',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.orderInstruction,
      title: 'Cambio de especificación en acabados',
      description:
          'Por instrucción de arquitectura, se debe cambiar el pegazulejo estándar por pegazulejo reforzado en todas las áreas húmedas.',
      location: 'Todos los niveles',
      createdById: 'user-004', // Owner
      createdBy: mockUsers[3],
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      photoUrls: const ['spec_sheet_v2.pdf'],
      commentsCount: 1,
    ),
    Incident(
      id: 'inc-004',
      organizationId: mockOrgId,
      projectId: 'proj-002',
      type: IncidentType.orderInstruction,
      title: 'Detener colado de trabes Eje B',
      description:
          'Suspender colado hasta verificar armado de acero. Faltan estribos adicionales según plano S-04 rev 2.',
      location: 'Nivel 1, Eje B',
      priority: IncidentPriority.critical,
      status: IncidentStatus.assigned,
      createdById: 'user-001', // Me
      createdBy: currentUser,
      assignedToId: 'user-002',
      assignedTo: mockUsers[1],
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),

    // REQUETS / QUERIES
    Incident(
      id: 'inc-005',
      organizationId: mockOrgId,
      projectId: 'proj-002',
      type: IncidentType.requestQuery,
      title: 'Duda sobre nivel de piso terminado',
      description:
          'El plano A-05 indica NPT +3.50 pero en corte se ve +3.60. ¿Cuál es el correcto para desplante de muros?',
      location: 'Acceso Principal',
      status: IncidentStatus.closed,
      createdById: 'user-003',
      createdBy: mockUsers[2],
      closedById: 'user-001',
      closedBy: currentUser,
      closedAt: DateTime.now().subtract(const Duration(days: 2)),
      closedNotes:
          'Se confirma NPT +3.60 según última revisión de proyecto ejecutivo.',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      commentsCount: 4,
    ),
    Incident(
      id: 'inc-006',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.requestQuery,
      title: 'Solicitud de material eléctrico',
      description:
          'Faltan 200m de cable cal. 12 para terminar circuitos de iluminación en ala oeste.',
      location: 'Ala Oeste, Nivel 4',
      status: IncidentStatus.assigned,
      createdById: 'user-001', // Me
      createdBy: currentUser,
      assignedToId: 'user-004', // Owner (Approver)
      assignedTo: mockUsers[3],
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      commentsCount: 2,
    ),

    // CERTIFICATIONS
    Incident(
      id: 'inc-007',
      organizationId: mockOrgId,
      projectId: 'proj-003',
      type: IncidentType.certification,
      title: 'Liberación de armado de losa',
      description:
          'Solicito revisión y liberación de armado de acero en losa tapa de cisterna para proceder a colado.',
      location: 'Cisterna 1',
      status: IncidentStatus.assigned,
      createdById: 'user-002',
      createdBy: mockUsers[1],
      assignedToId: 'user-001', // Me
      assignedTo: currentUser,
      createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
      photoUrls: const ['armado_cisterna.jpg'],
    ),
    Incident(
      id: 'inc-008',
      organizationId: mockOrgId,
      projectId: 'proj-003',
      type: IncidentType.certification,
      title: 'Prueba de hermeticidad tubería gas',
      description:
          'Prueba de presión realizada a 4kg/cm2 durante 24h. Sin caídas de presión.',
      location: 'Departamentos 301-304',
      status: IncidentStatus.closed,
      createdById: 'user-001', // Me
      createdBy: currentUser,
      closedById: 'user-004',
      closedBy: mockUsers[3],
      closedAt: DateTime.now().subtract(const Duration(hours: 12)),
      closedNotes: 'Aprobado. Proceder con cierre de ductos.',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      photoUrls: const [
        'manometro_inicio.jpg',
        'manometro_fin.jpg',
        'reporte.pdf',
      ],
      commentsCount: 3,
    ),

    // MORE MIXED EXAMPLES
    Incident(
      id: 'inc-009',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Robo de herramienta menor',
      description:
          'Se reporta falta de 2 taladros inalámbricos del almacén de contratista eléctrico.',
      location: 'Bodega 2',
      priority: IncidentPriority.critical,
      createdById: 'user-005',
      createdBy: mockUsers[4],
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      commentsCount: 1,
    ),
    Incident(
      id: 'inc-010',
      organizationId: mockOrgId,
      projectId: 'proj-001',
      type: IncidentType.incidentNotification,
      title: 'Retraso en entrega de concreto',
      description:
          'La olla de concreto programada para las 8:00 AM no ha llegado. Retraso de 2 horas en colado.',
      location: 'Acceso Vehicular',
      status: IncidentStatus.closed,
      createdById: 'user-001',
      createdBy: currentUser,
      closedById: 'user-001',
      closedBy: currentUser,
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
      closedAt: DateTime.now().subtract(const Duration(days: 5, hours: 2)),
      closedNotes: 'Llegó a las 10:30 AM. Se reprogramó personal.',
      commentsCount: 6,
    ),
    Incident(
      id: 'inc-011',
      organizationId: mockOrgId,
      projectId: 'proj-002',
      type: IncidentType.requestQuery,
      title: 'Cambio de color en pintura fachada',
      description:
          'El tono muestra aplicado no coincide con el render. ¿Se autoriza cambio a pantone 432C?',
      location: 'Fachada Sur',
      status: IncidentStatus.assigned,
      createdById: 'user-002',
      createdBy: mockUsers[1],
      assignedToId: 'user-004', // Owner
      assignedTo: mockUsers[3],
      createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
      photoUrls: const ['muestra_pintura.jpg'],
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
