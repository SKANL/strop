# 📱 STROP MOBILE APP - Especificación Funcional

> **Versión:** 1.1 MVP (Stack Agnóstico)
> **Última actualización:** Enero 10, 2026
> **Audiencia:** Product Managers, Arquitectos, Desarrolladores
> **Complemento:** Ver `STROP_WEB_PLATFORM.md` y `STROP_INTEGRATION.md`

---

## 📋 RESUMEN EJECUTIVO

La aplicación móvil de STROP está diseñada para **personal de campo** (Residentes y Cabos) que necesitan reportar incidencias rápidamente desde la obra. Es la herramienta de captura de datos que alimenta al dashboard web.

### Rol en el Ecosistema

| Aspecto | Descripción |
|---------|-------------|
| **¿Quién la usa?** | RESIDENT, CABO - Perfil campo/obra |
| **¿Desde dónde?** | Smartphone (Android/iOS) en obra |
| **¿Para qué?** | Reportar incidencias con fotos, ver asignaciones, comentar |
| **Complemento con Web** | Genera datos que el D/A consume en el dashboard web |

---

## 🎯 OBJETIVOS DE NEGOCIO CUBIERTOS

### Objetivo 1: Agilizar la captura de información en campo
>
> **Rol de la App:** Generador principal de datos

| Característica App | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Crear incidencia en <30 seg | Formulario optimizado para móvil | **Data API** (INSERT) |
| Captura de 1-5 fotos | Cámara integrada con compresión | **Storage** (Upload resumable) |
| Modo offline | Cola de sincronización local | **Data API** + Local Storage |
| Geolocalización automática | GPS del dispositivo | **Database** (metadata JSONB) |

### Objetivo 2: Centralizar y organizar el flujo de incidencias
>
> **Rol de la App:** Contribuidor de datos estructurados

| Característica App | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Selector de tipo de incidencia | Clasificación predefinida (4 tipos) | **Database** (ENUM incident_type) |
| Selector de prioridad | NORMAL / CRITICAL | **Database** (ENUM incident_priority) |
| Selector de proyecto | Lista de proyectos asignados | **Data API** (project_members) |
| Flujo guiado | Wizard paso a paso | Frontend (componentes nativos) |

### Objetivo 3: Acelerar la toma de decisiones
>
> **Rol de la App:** Canal de respuesta rápida

| Característica App | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Push notifications | Alertas de incidencias asignadas | **Realtime** + **Edge Functions** |
| Ver incidencias asignadas | Lista de tareas pendientes | **Data API** (filter assigned_to) |
| Comentarios en incidencias | Comunicación bidireccional | **Realtime** + **Data API** |
| Cerrar incidencias (RESIDENT) | Resolución desde campo | **Data API** (UPDATE status) |

---

## 🏗️ ARQUITECTURA TÉCNICA

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP                              │
│  (Framework nativo o cross-platform)                        │
│  - Gestión de estado para datos reactivos                   │
│  - Base de datos local para modo offline                    │
│  - Notificaciones via Supabase Realtime                     │
│  - Acceso a cámara y galería                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Auth        │ │ Database    │ │ Realtime                ││
│  │ - Email/Pwd │ │ - PostgreSQL│ │ - Postgres Changes      ││
│  │ - JWT Hook  │ │ - RLS       │ │ - Comments en vivo      ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Storage     │ │ Data API    │ │ Edge Functions          ││
│  │ - Photos    │ │ - PostgREST │ │ - Email Invitations     ││
│  │ - Resumable │ │             │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 MODELO DE DATOS RELEVANTE PARA MOBILE

### Tablas que la App Consume/Produce

#### Tablas de Solo Lectura (READ)

| Tabla | Campos Utilizados | Propósito en Mobile |
|-------|-------------------|---------------------|
| `users` | `id`, `full_name`, `email`, `role`, `profile_picture_url`, `theme_mode`, `organization_id` | Mi perfil, datos de autores en comentarios |
| `projects` | `id`, `name`, `location`, `status`, `start_date`, `end_date` | Lista de proyectos asignados, selector |
| `project_members` | `project_id`, `user_id`, `assigned_role` | Verificar a qué proyectos estoy asignado |
| `organizations` | `id`, `name`, `logo_url` | Mostrar info de la empresa en perfil |

#### Tablas de Lectura/Escritura (CRUD)

| Tabla | Operaciones | Campos en INSERT | Campos en UPDATE |
|-------|-------------|------------------|------------------|
| `incidents` | CREATE, READ, UPDATE | `project_id`, `type`, `title`, `description`, `location` (opcional), `priority` (status='OPEN' auto) | `status`, `closed_at`, `closed_by`, `closed_notes` |
| `photos` | CREATE, READ | `incident_id`, `storage_path` (org_id auto via trigger) | - |
| `comments` | CREATE, READ | `incident_id`, `text` (author_id auto via trigger) | - |

### Detalle de Columnas por Tabla

#### `incidents` - Campos Completos

| Columna | Tipo | En Mobile | Descripción |
|---------|------|-----------|-------------|
| `id` | UUID | READ | Identificador único |
| `organization_id` | UUID | AUTO | Se establece via JWT claim |
| `project_id` | UUID | CREATE | Proyecto seleccionado |
| `type` | incident_type | CREATE | Tipo de incidencia (4 opciones) |
| `title` | VARCHAR(255) | CREATE | Título resumido del problema |
| `description` | TEXT (max 1000) | CREATE | Descripción detallada |
| `location` | VARCHAR(255) | CREATE (opcional) | Ubicación específica en la obra |
| `priority` | incident_priority | CREATE | 'NORMAL' o 'CRITICAL' |
| `status` | incident_status | READ/UPDATE | 'OPEN' → 'ASSIGNED' → 'CLOSED' |
| `created_by` | UUID | AUTO | Se establece via trigger |
| `assigned_to` | UUID | READ | Quién debe resolver (asignado desde Web) |
| `closed_at` | TIMESTAMPTZ | UPDATE | Fecha de cierre (al cerrar) |
| `closed_by` | UUID | UPDATE | Usuario que cerró |
| `closed_notes` | TEXT (max 1000) | UPDATE | Notas de resolución |
| `created_at` | TIMESTAMPTZ | READ | Fecha de creación |

#### `photos` - Campos Completos

| Columna | Tipo | En Mobile | Descripción |
|---------|------|-----------|-------------|
| `id` | UUID | READ | Identificador único |
| `organization_id` | UUID | AUTO | Se establece via JWT claim |
| `incident_id` | UUID | CREATE | FK a la incidencia |
| `storage_path` | VARCHAR(500) | CREATE | Path: `{org_id}/{project_id}/{incident_id}/{uuid}.jpg` |
| `uploaded_by` | UUID | AUTO | Se establece via trigger |
| `uploaded_at` | TIMESTAMPTZ | READ | Fecha de subida |

**Validación**: Trigger `validate_photo_count` limita a máximo 5 fotos por incidencia.

#### `comments` - Campos Completos

| Columna | Tipo | En Mobile | Descripción |
|---------|------|-----------|-------------|
| `id` | UUID | READ | Identificador único |
| `organization_id` | UUID | AUTO | Se establece via JWT claim |
| `incident_id` | UUID | CREATE | FK a la incidencia |
| `author_id` | UUID | AUTO/READ | Autor del comentario |
| `text` | TEXT (max 1000) | CREATE/READ | Contenido del comentario |
| `created_at` | TIMESTAMPTZ | READ | Fecha de creación |

---

### ENUMs Utilizados en Mobile (Detalle Completo)

#### `incident_type` - Tipos de Incidencia

| Valor ENUM | Etiqueta UI | Icono | Color Sugerido | Descripción Completa |
|------------|-------------|-------|----------------|----------------------|
| `ORDER_INSTRUCTION` | Órdenes e Instrucciones | 📋 | Azul (#2563EB) | Directivas de trabajo, cambios de alcance, instrucciones del D/A al campo |
| `REQUEST_QUERY` | Solicitudes y Consultas | ❓ | Amarillo (#EAB308) | Preguntas, aclaraciones, solicitudes de información o materiales |
| `CERTIFICATION` | Certificaciones | ✅ | Verde (#16A34A) | Validaciones, aprobaciones, conformidades, certificados de calidad |
| `INCIDENT_NOTIFICATION` | Notificaciones de Incidentes | ⚠️ | Rojo (#DC2626) | Problemas, fallas, accidentes, situaciones que requieren atención inmediata |

#### `incident_priority` - Prioridades

| Valor ENUM | Etiqueta UI | Icono | Color | Comportamiento |
|------------|-------------|-------|-------|----------------|
| `NORMAL` | Normal | - | Gris (#6B7280) | Seguimiento estándar |
| `CRITICAL` | Crítica | 🚨 | Rojo (#DC2626) | Atención inmediata, notificación destacada |

#### `incident_status` - Estados

| Valor ENUM | Etiqueta UI | Icono | Color | Descripción |
|------------|-------------|-------|-------|-------------|
| `OPEN` | Abierta | 🔵 | Azul (#3B82F6) | Recién creada, esperando asignación |
| `ASSIGNED` | Asignada | 🟡 | Amarillo (#F59E0B) | Asignada a un responsable |
| `CLOSED` | Cerrada | 🟢 | Verde (#10B981) | Resuelta y cerrada |

#### `project_status` - Estados de Proyecto

| Valor ENUM | Etiqueta UI | Visible en Selector | Descripción |
|------------|-------------|---------------------|-------------|
| `ACTIVE` | Activo | ✅ SÍ | Proyecto en curso |
| `PAUSED` | Pausado | ❌ NO | Proyecto detenido temporalmente |
| `COMPLETED` | Completado | ❌ NO | Proyecto finalizado |

---

### Storage - Bucket `incident-photos`

| Propiedad | Valor |
|-----------|-------|
| **Visibilidad** | Privado (requiere autenticación) |
| **Límite por archivo** | 5MB |
| **Tipos MIME permitidos** | `image/jpeg`, `image/png`, `image/webp` |
| **Estructura de path** | `{organization_id}/{project_id}/{incident_id}/{uuid}.jpg` |
| **Máximo por incidencia** | 5 fotos (validado por trigger) |

**Estrategia de Compresión Recomendada:**

- Ancho máximo: 1920px
- Calidad JPEG: 80%
- Resultado: ~200KB por foto (vs ~5MB original de cámara 12MP)

---

## 📱 PANTALLAS Y FUNCIONALIDADES

### 1. Login / Onboarding

**Propósito:** Autenticar usuario y mostrar proyectos asignados.

| Componente | Descripción | Servicio Supabase | Objetivo |
|------------|-------------|-------------------|----------|
| Login Form | Email + Password | **Auth** - signInWithPassword | - |
| Remember Me | Persistir sesión | **Auth** - Session storage | - |
| Onboarding | Tutorial primer uso | Local (almacenamiento del dispositivo) | - |

#### Flujo de Datos: Autenticación

1. **Usuario ingresa credenciales**: Email y password en formulario de login.
2. **Llamada a Supabase Auth**: Invocar método `signInWithPassword` con las credenciales.
3. **Respuesta con sesión**: Supabase retorna token JWT con sesión.
4. **Custom Access Token Hook (Schema v3.2)**: El hook inyecta automáticamente:
   - `current_org_id`: UUID de la organización actual (desde `users.current_organization_id`)
   - `current_org_role`: Rol del usuario (desde `organization_members.role`)
   - Estos claims se extraen del JWT sin queries adicionales
5. **Persistir sesión**: Almacenar tokens en storage seguro del dispositivo para auto-login futuro.

**Código de ejemplo (Dart/Flutter):**
```dart
final response = await supabase.auth.signInWithPassword(
  email: emailController.text,
  password: passwordController.text,
);

if (response.session != null) {
  // Los custom claims ya están en el JWT
  final session = response.session!;
  final user = session.user;
  
  // Extraer claims inyectados por custom_access_token_hook
  final orgId = user.userMetadata?['current_org_id'];
  final orgRole = user.userMetadata?['current_org_role'];
  
  print('Logged in as $orgRole in org $orgId');
}
```

**¿Por qué persistir sesión?**
> Cumple el **Objetivo 1**: El personal de campo no debe perder tiempo re-autenticándose cada vez que abre la app. La sesión persiste hasta logout o expiración.

**⚡ Performance: Custom Access Token Hook**
> El schema v3.2 incluye un `custom_access_token_hook` que inyecta el contexto organizacional directamente en el JWT. Esto elimina la necesidad de queries adicionales para obtener `organization_id` y `role` en cada request.

---

### 2. Home - Mis Incidencias

**Propósito:** Vista principal con incidencias relevantes para el usuario.

| Tab | Descripción | Servicio Supabase | Objetivo |
|-----|-------------|-------------------|----------|
| **Asignadas a mí** | Incidencias que debo resolver | **Data API** - filter assigned_to | Obj 3 |
| **Creadas por mí** | Mis reportes y su estado | **Data API** - filter created_by | Obj 1 |
| **Proyecto actual** | Todas las incidencias del proyecto | **Data API** + **Realtime** | Obj 2 |

#### Flujo de Datos: Consulta de Incidencias Asignadas

1. **Consultar tabla `incidents`**: Seleccionar campos específicos más datos relacionados del proyecto.
2. **Filtro de asignación**: Restringir estrictamente a registros donde `assigned_to` es igual al ID del usuario actual.
3. **Excluir cerradas**: Filtrar donde `status` es distinto de 'CLOSED'.
4. **Ordenamiento doble**:
   - Primero por `priority` en orden descendente (CRÍTICAS primero)
   - Luego por `created_at` en orden descendente (más recientes primero)

**Código de ejemplo (Dart/Flutter):**
```dart
final response = await supabase
  .from('incidents')
  .select('''
    id,
    type,
    title,
    description,
    priority,
    status,
    created_at,
    project:projects(
      id,
      name,
      location
    )
  ''')
  .eq('assigned_to', supabase.auth.currentUser!.id)
  .neq('status', 'CLOSED')
  .order('priority', ascending: false)
  .order('created_at', ascending: false);

if (response != null) {
  final incidents = response as List<dynamic>;
  // Actualizar UI con las incidencias
}
```

**⚡ Performance: RLS Optimizado (Schema v3.2)**
> Las RLS policies usan el patrón `(select auth.uid())` en lugar de `auth.uid()` directo. Esto cachea el resultado de `auth.uid()` por statement, logrando **99.94% de mejora de performance** según benchmarks de Supabase.
>
> **Ejemplo de policy aplicada:**
> ```sql
> CREATE POLICY "Users can view organization incidents"
> ON incidents FOR SELECT
> TO authenticated
> USING ((select auth.jwt() ->> 'current_org_id')::uuid = organization_id);
> ```

**🎯 Best Practices:**
- ✅ Especificar exactamente qué campos necesitas (evitar `select('*')`)
- ✅ Usar filtros explícitos aunque RLS filtre automáticamente
- ✅ Limitar resultados con `.limit(20)` para listados paginados
- ✅ Usar foreign key names para joins específicos (ej: `project:projects`)

#### Flujo de Datos: Suscripción Realtime para Nuevas Asignaciones

**⚠️ IMPORTANTE - Consideraciones de Performance:**
> Postgres Changes tiene limitaciones de escala:
> - Cada evento INSERT/UPDATE dispara evaluación de RLS policies por cada subscriber
> - Con 100 usuarios = 100 "reads" por cada INSERT
> - Procesamiento en single thread (upgrades de compute no ayudan mucho)
> - Para >100 usuarios concurrentes, considerar **Broadcast** en lugar de Postgres Changes

**Configuración de Realtime (Dart/Flutter):**
```dart
// 1. Habilitar Postgres Changes en la tabla desde Dashboard:
// Settings > Replication > supabase_realtime publication
// Agregar tabla 'incidents'

// 2. Crear política RLS para permitir SELECT en incidents
// (Ya existe en schema: permite SELECT si organization_id coincide)

// 3. Establecer canal y suscripción con filtros server-side
final channel = supabase
  .channel('incident-changes') // Nombre único de canal
  .onPostgresChanges(
    event: PostgresChangeEvent.update, // Solo eventos UPDATE
    schema: 'public',
    table: 'incidents',
    filter: PostgresChangeFilter(
      type: PostgresChangeFilterType.eq,
      column: 'assigned_to',
      value: currentUserId, // Filtro server-side para reducir payload
    ),
    callback: (payload) {
      // payload contiene:
      // - eventType: 'UPDATE'
      // - newRecord: Map con datos nuevos
      // - oldRecord: Map con datos anteriores (si replica identity = full)
      
      final incident = payload.newRecord;
      _showLocalNotification(
        title: 'Nueva incidencia asignada',
        body: incident['title'],
      );
      
      // Actualizar estado local (setState, Provider, Riverpod, etc.)
      _refreshIncidentsList();
    },
  )
  .subscribe(); // Iniciar suscripción

// 4. Cleanup al salir de la pantalla
@override
void dispose() {
  channel.unsubscribe(); // Cancelar suscripción
  super.dispose();
}
```

**MEJORES PRÁCTICAS - Realtime Performance**:

1. **Filtros del lado del servidor**: Usar `filter` en la suscripción reduce payload y carga en cliente
2. **Unsubscribe al desmontar**: Siempre cancelar suscripciones para evitar memory leaks
3. **Debounce de actualizaciones**: Si recibes muchos eventos, considera debouncing:
   ```dart
   Timer? _debounce;
   void _onRealtimeEvent(payload) {
     _debounce?.cancel();
     _debounce = Timer(Duration(milliseconds: 300), () {
       _refreshIncidentsList();
     });
   }
   ```
4. **Evitar múltiples suscripciones a la misma tabla**: Consolidar filtros en una sola suscripción cuando sea posible
5. **Limitaciones de Postgres Changes**:
   - DELETE events no son filtrables (limitación de Postgres WAL)
   - Performance depende de RLS policies - usa patrón `(select auth.uid())` para cacheo
   - Si necesitas alta escalabilidad, considera usar Broadcast en lugar de Postgres Changes

**¿Por qué Realtime para asignaciones?**
> Cumple el **Objetivo 3**: Cuando el D/A asigna una incidencia desde la web, el RESIDENT en campo ve la asignación instantáneamente sin refrescar.

---

### 3. Crear Incidencia (Core)

**Propósito:** Flujo optimizado para reportar problemas en <30 segundos.

| Paso | Descripción | Servicio Supabase | Objetivo |
|------|-------------|-------------------|----------|
| 1. Seleccionar proyecto | Dropdown de mis proyectos | **Data API** - project_members | Obj 2 |
| 2. Tipo de incidencia | 4 opciones con iconos | Local (enum) | Obj 2 |
| 3. Descripción | Campo de texto (max 1000 chars) | Local (validation) | Obj 1 |
| 4. Prioridad | Toggle NORMAL/CRITICAL | Local | Obj 2 |
| 5. Fotos (1-5) | Cámara o galería | **Storage** - Resumable upload | Obj 1 |
| 6. Confirmar | Enviar o guardar offline | **Data API** + Offline queue | Obj 1 |

#### Flujo de Datos: Enviar Incidencia

1. **Validar campos**: Verificar que todos los campos requeridos están completos.
2. **Verificar conectividad**: Comprobar si hay conexión a internet.
   - **Si NO hay conexión**: Guardar en cola offline local y mostrar mensaje "Guardado offline. Se enviará cuando haya conexión."
   - **Si hay conexión**: Continuar con el envío.
3. **Subir fotos primero**: Ejecutar upload resumable de cada foto a Storage.
4. **Insertar incidencia**: Crear registro en tabla `incidents` con:
   - `project_id`: Proyecto seleccionado
   - `type`: Tipo de incidencia ('ORDER_INSTRUCTION', 'REQUEST_QUERY', 'CERTIFICATION', 'INCIDENT_NOTIFICATION')
   - `title`: Título resumido
   - `description`: Texto descriptivo (max 1000 chars)
   - `priority`: Prioridad (NORMAL o CRITICAL)
   - `location`: Ubicación específica en la obra (opcional)
   - **⚡ Auto-poblados por triggers (Schema v3.2):**
     - `organization_id`: Extraido automáticamente desde el proyecto
     - `created_by`: Extraido automáticamente desde `auth.uid()`
     - `status`: Default 'OPEN'
     - `created_at`: Default NOW()
5. **Registrar fotos en DB**: Para cada foto subida, insertar en tabla `photos` con:
   - `incident_id`: ID de la incidencia recién creada
   - `storage_path`: Ruta en Storage
   - **⚡ Auto-poblados por triggers:**
     - `organization_id`: Extraido desde incident
     - `uploaded_by`: Extraido desde `auth.uid()`
6. **Confirmar éxito**: Mostrar mensaje y navegar a Home.

**Código de ejemplo (Dart/Flutter):**
```dart
// 1. Subir fotos primero
final uploadedPaths = <String>[];
for (final photo in selectedPhotos) {
  final path = await uploadPhotoResumable(photo, projectId, tempIncidentId);
  if (path != null) uploadedPaths.add(path);
}

// 2. Insertar incidencia
final response = await supabase.from('incidents').insert({
  'project_id': selectedProjectId,
  'type': selectedType, // 'INCIDENT_NOTIFICATION'
  'title': titleController.text,
  'description': descriptionController.text,
  'priority': isPriorityCritical ? 'CRITICAL' : 'NORMAL',
  'location': locationController.text,
  // organization_id, created_by, status, created_at -> auto via triggers
}).select().single();

final incidentId = response['id'];

// 3. Registrar fotos en DB
for (final path in uploadedPaths) {
  await supabase.from('photos').insert({
    'incident_id': incidentId,
    'storage_path': path,
    // organization_id, uploaded_by -> auto via triggers
  });
}
```

#### Flujo de Datos: Upload de Fotos (Resumable)

**🔑 RECOMENDACIÓN:** Usar **Resumable Uploads** (TUS protocol) para mayor confiabilidad en conexiones inestables.

**Ventajas de Resumable Upload:**
- ✅ Resiliencia ante interrupciones de red
- ✅ Progress tracking para mejor UX
- ✅ Reintentos automáticos
- ✅ Ideal para conexiones de campo

**Implementación en Dart/Flutter con tus_client:**

```dart
import 'package:tus_client/tus_client.dart';

Future<String?> uploadPhotoResumable(
  File photoFile,
  String projectId,
  String incidentId,
) async {
  final session = supabase.auth.currentSession;
  if (session == null) return null;
  
  final orgId = session.user.userMetadata?['current_org_id'];
  final fileName = '${Uuid().v4()}.jpg';
  final storagePath = '$orgId/$projectId/$incidentId/$fileName';
  
  try {
    final client = TusClient(
      Uri.parse(
        'https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable',
      ),
      photoFile,
      store: TusMemoryStore(), // O TusFileStore() para persistir progreso
      headers: {
        'Authorization': 'Bearer ${session.accessToken}',
        'x-upsert': 'false',
      },
      metadata: {
        'bucketName': 'incident-photos',
        'objectName': storagePath,
        'contentType': 'image/jpeg',
        'cacheControl': '3600',
      },
      maxChunkSize: 6 * 1024 * 1024, // 6MB chunks
    );

    client.onProgress = (progress, total) {
      final percentage = (progress / total * 100).toStringAsFixed(1);
      print('Upload progress: $percentage%');
      // Actualizar UI con progress bar
    };

    await client.upload();
    return storagePath;
  } catch (e) {
    print('Upload failed: $e');
    return null;
  }
}
```

**Upload Simple (Para archivos pequeños <6MB):**

```dart
Future<String?> uploadPhotoSimple(
  File photoFile,
  String projectId,
  String incidentId,
) async {
  final session = supabase.auth.currentSession;
  if (session == null) return null;
  
  final orgId = session.user.userMetadata?['current_org_id'];
  final fileName = '${Uuid().v4()}.jpg';
  final storagePath = '$orgId/$projectId/$incidentId/$fileName';
  
  try {
    await supabase.storage.from('incident-photos').upload(
      storagePath,
      photoFile,
      fileOptions: const FileOptions(
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      ),
    );
    return storagePath;
  } catch (e) {
    print('Upload failed: $e');
    return null;
  }
}
```

**⚠️ Validaciones de Storage (Schema v3.2):**
- **Máximo 5 fotos por incidencia**: Validado por trigger `validate_photo_count`
- **Tamaño máximo 5MB**: Configurado en bucket policy
- **Path consistency**: Trigger `validate_storage_path_organization` previene paths incorrectos
- **MIME types permitidos**: `image/jpeg`, `image/png`, `image/webp`

**🎯 Best Practices:**
- ✅ Comprimir fotos antes de subir (max 1920px, calidad 80% JPEG)
- ✅ Usar resumable upload para archivos >1MB
- ✅ Implementar retry logic con backoff exponencial
- ✅ Mostrar progress bar para mejor UX
- ✅ Validar cantidad de fotos antes de subir (max 5)

```dart
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:image/image.dart' as img;
import 'package:uuid/uuid.dart';

Future<String> uploadIncidentPhoto({
  required String incidentId,
  required String projectId,
  required File photoFile,
}) async {
  // 1. Comprimir imagen antes de subir
  final bytes = await photoFile.readAsBytes();
  final image = img.decodeImage(bytes);
  if (image == null) throw Exception('Error al procesar imagen');
  
  // Redimensionar a máximo 1920px de ancho
  final resized = img.copyResize(image, width: 1920);
  final compressed = img.encodeJpg(resized, quality: 80);
  
  // 2. Generar path único siguiendo estructura requerida
  final orgId = supabase.auth.currentSession?.user.userMetadata?['current_org_id'];
  final fileName = '${const Uuid().v4()}.jpg';
  final storagePath = '$orgId/$projectId/$incidentId/$fileName';
  
  // 3. Upload con validación de RLS
  // RLS Policy valida: bucket_id = 'incident-photos' AND organization_id del path coincide con JWT
  await supabase.storage
      .from('incident-photos')
      .uploadBinary(
        storagePath,
        compressed,
        fileOptions: FileOptions(
          contentType: 'image/jpeg',
          upsert: false, // No sobrescribir si existe
        ),
      );
  
  // 4. Retornar path para registro en DB
  return storagePath;
}
```

**Validaciones Automáticas**:
- **Bucket limit**: Máximo 5MB por archivo (rechazado por Supabase)
- **MIME types**: Solo `image/jpeg`, `image/png`, `image/webp` permitidos
- **RLS Policy**: Valida que organization_id del path coincida con JWT claim
- **Trigger**: `validate_photo_count` rechaza si ya hay 5 fotos en la incidencia

**¿Por qué Resumable Upload?**
> Cumple el **Objetivo 1**: En obras de construcción la señal de internet puede ser intermitente. El upload resumable permite pausar y continuar la subida sin perder progreso.

**¿Por qué compresión de imágenes?**
> Cumple el **Objetivo 1**: Fotos de 12MP del teléfono son ~5MB. Comprimir a 1920px y 80% quality reduce a ~200KB sin pérdida visual significativa. Subida más rápida + menor uso de cuota de storage.

---

## 🔒 SEGURIDAD Y RLS (ROW LEVEL SECURITY)

### Políticas RLS Aplicadas en Mobile

Todas las operaciones de la app móvil están protegidas por RLS policies definidas en el schema SQL. El JWT del usuario autenticado se evalúa automáticamente en cada query.

#### Tabla `incidents`

**SELECT Policy** - Ver solo incidencias de mi organización:
```sql
CREATE POLICY "Users can view incidents in their org"
ON incidents FOR SELECT
TO authenticated
USING (
  organization_id = (select auth.jwt()->>'current_org_id')::UUID
);
```

**INSERT Policy** - Crear incidencias en mi organización:
```sql
CREATE POLICY "Users can create incidents in their org"
ON incidents FOR INSERT
TO authenticated
WITH CHECK (
  -- Validar que el proyecto pertenece a mi org
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = incidents.project_id 
    AND organization_id = (select auth.jwt()->>'current_org_id')::UUID
  )
);
```

**UPDATE Policy** - Cerrar incidencias (RESIDENT+):
```sql
CREATE POLICY "Users can update incidents they created or are assigned to"
ON incidents FOR UPDATE
TO authenticated
USING (
  organization_id = (select auth.jwt()->>'current_org_id')::UUID
  AND (
    created_by = (SELECT id FROM users WHERE auth_id = (select auth.uid()))
    OR assigned_to = (SELECT id FROM users WHERE auth_id = (select auth.uid()))
    OR (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
  )
);
```

#### Tabla `photos`

**SELECT Policy** - Ver fotos de mi organización:
```sql
CREATE POLICY "Users can view photos in their org"
ON photos FOR SELECT
TO authenticated
USING (organization_id = (select auth.jwt()->>'current_org_id')::UUID);
```

**INSERT Policy** - Subir fotos a incidencias de mi org:
```sql
CREATE POLICY "Users can upload photos to incidents in their org"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM incidents
    WHERE id = photos.incident_id
    AND organization_id = (select auth.jwt()->>'current_org_id')::UUID
  )
);
```

### Storage RLS Policies

**Bucket `incident-photos`** (privado):

```sql
-- Policy para upload
CREATE POLICY "Users can upload to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = (select auth.jwt()->>'current_org_id')
);

-- Policy para download (via signed URLs)
CREATE POLICY "Users can download from their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = (select auth.jwt()->>'current_org_id')
);
```

### CRÍTICO - Validaciones Automáticas

**Triggers de Seguridad**:

1. **Auto-populate `organization_id`**: Triggers establecen automáticamente el org_id del JWT
   ```sql
   -- Trigger en incidents
   CREATE TRIGGER set_incident_organization
   BEFORE INSERT ON incidents
   FOR EACH ROW
   EXECUTE FUNCTION set_organization_from_project();
   ```

2. **Auto-populate `created_by` / `author_id`**: Se establece desde auth.uid()
   ```sql
   -- En trigger o RLS
   created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
   ```

3. **Validación de conteo de fotos**: Máximo 5 fotos por incidencia
   ```sql
   CREATE TRIGGER validate_photo_count
   BEFORE INSERT ON photos
   FOR EACH ROW
   EXECUTE FUNCTION validate_max_photos();
   ```

**IMPORTANTE**: 
- NUNCA confiar en datos del cliente para `organization_id` o `created_by`
- Siempre usar JWT claims y triggers para establecer estos valores
- Las RLS policies usan patrón `(select auth.uid())` para performance (caching)

---

## 📡 DATA API - CONSULTAS OPTIMIZADAS

### Uso de PostgREST con Supabase Client

La Data API de Supabase usa PostgREST que expone automáticamente la base de datos como REST API. Todas las consultas respetan RLS.

#### Consultas Básicas

**SELECT con relaciones (foreign keys)**:
```dart
// Obtener incidencias con datos del proyecto y fotos
final response = await supabase
    .from('incidents')
    .select('''
      *,
      projects:project_id (
        id,
        name,
        location
      ),
      photos (
        id,
        storage_path,
        uploaded_at
      ),
      assigned_user:assigned_to (
        id,
        full_name,
        role
      )
    ''')
    .eq('status', 'OPEN')
    .order('priority', ascending: false)
    .order('created_at', ascending: false);

final incidents = response as List;
```

**Filtros Avanzados**:
```dart
// Filtrar por múltiples condiciones
final response = await supabase
    .from('incidents')
    .select('*')
    .eq('project_id', projectId)
    .in_('status', ['OPEN', 'ASSIGNED'])
    .gte('created_at', DateTime.now().subtract(Duration(days: 30)).toIso8601String())
    .or('priority.eq.CRITICAL,assigned_to.eq.$userId');
```

**Búsqueda Full-Text** (si se configura):
```dart
// Buscar en título y descripción
final response = await supabase
    .from('incidents')
    .select('*')
    .textSearch('title', 'tubería rota', config: 'spanish');
```

#### INSERT con Returning

```dart
// Crear incidencia y obtener ID generado
final response = await supabase
    .from('incidents')
    .insert({
      'project_id': projectId,
      'type': 'INCIDENT_NOTIFICATION',
      'title': 'Fuga en tubería',
      'description': 'Fuga detectada en el tercer piso',
      'priority': 'CRITICAL',
      'location': 'Edificio A - Piso 3',
    })
    .select('id, created_at')
    .single();

final newIncidentId = response['id'];
```

#### UPDATE

```dart
// Cerrar incidencia (RLS valida permisos)
await supabase
    .from('incidents')
    .update({
      'status': 'CLOSED',
      'closed_at': DateTime.now().toIso8601String(),
      'closed_notes': 'Reparación completada',
    })
    .eq('id', incidentId);
```

### Performance Tips

1. **Usar `.select()` específico**: No traer todos los campos si no son necesarios
   ```dart
   .select('id, title, status, created_at') // Más rápido que .select('*')
   ```

2. **Limitar resultados**: Usar `.limit()` y paginación
   ```dart
   .select('*').limit(50).range(0, 49) // Primera página de 50 items
   ```

3. **Índices en columnas filtradas**: El schema ya tiene índices en:
   - `incidents.organization_id`
   - `incidents.project_id`
   - `incidents.status`
   - `incidents.assigned_to`

4. **Cachear en cliente**: Para datos que no cambian frecuentemente (proyectos, ENUMs)

---

**Propósito:** Ver información completa y agregar comentarios/cierre.

| Sección | Descripción | Servicio Supabase | Objetivo |
|---------|-------------|-------------------|----------|
| Header | Tipo, prioridad, estado, fecha | **Data API** - incident data | Obj 2 |
| Descripción | Texto completo | **Data API** | Obj 2 |
| Galería de fotos | Carousel de imágenes | **Storage** - Signed URLs | Obj 1 |
| Comentarios | Thread de discusión | **Realtime** + **Data API** | Obj 3 |
| Acciones | Cerrar (si soy RESIDENT+) | **Data API** - UPDATE | Obj 3 |

#### Flujo de Datos: Suscripción Realtime para Comentarios

**Implementación en Dart/Flutter**:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class IncidentDetailScreen extends StatefulWidget {
  final String incidentId;
  // ...
}

class _IncidentDetailScreenState extends State<IncidentDetailScreen> {
  late RealtimeChannel _commentsChannel;
  List<Comment> _comments = [];

  @override
  void initState() {
    super.initState();
    _loadInitialComments();
    _subscribeToComments();
  }

  Future<void> _loadInitialComments() async {
    // Cargar comentarios existentes
    final response = await supabase
        .from('comments')
        .select('*, users:author_id(full_name, role)')
        .eq('incident_id', widget.incidentId)
        .order('created_at', ascending: true);
    
    setState(() {
      _comments = (response as List).map((e) => Comment.fromJson(e)).toList();
    });
  }

  void _subscribeToComments() {
    // Establecer suscripción Realtime con filtro específico
    _commentsChannel = supabase
        .channel('comments-${widget.incidentId}') // Canal único por incidencia
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'comments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'incident_id',
            value: widget.incidentId,
          ),
          callback: (payload) async {
            // Nuevo comentario recibido (puede venir de Web o Mobile)
            final newCommentData = payload.newRecord;
            
            // Fetch datos del autor (RLS permite SELECT si organization_id coincide)
            final authorData = await supabase
                .from('users')
                .select('full_name, role')
                .eq('id', newCommentData['author_id'])
                .single();
            
            // Agregar al estado local
            setState(() {
              _comments.add(Comment.fromJson({
                ...newCommentData,
                'users': authorData,
              }));
            });
            
            // Scroll automático al nuevo comentario
            _scrollToBottom();
          },
        )
        .subscribe();
  }

  @override
  void dispose() {
    _commentsChannel.unsubscribe(); // CRÍTICO: Cleanup al salir
    super.dispose();
  }
}
```

**RLS Policy Aplicada**:
```sql
-- Policy en comments permite SELECT si organization_id coincide
CREATE POLICY "Users can view comments in their org"
ON comments FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'current_org_id')::UUID = organization_id);
```

**¿Por qué Realtime para comentarios?**
> Cumple el **Objetivo 3**: Cuando el D/A comenta desde la web, el personal de campo ve la respuesta al instante. Comunicación bidireccional sin refrescar.

#### Flujo de Datos: Cerrar Incidencia (RESIDENT+)

1. **Validar permisos**: Verificar que el claim `user_role` del JWT no sea 'CABO'.
   - Si es CABO, rechazar operación con error "Solo RESIDENT o superior puede cerrar".
2. **Actualizar incidencia**: Ejecutar UPDATE en tabla `incidents` donde `id` coincide, estableciendo:
   - `status`: 'CLOSED'
   - `closed_at`: Fecha/hora actual en formato ISO8601
   - `closed_by`: ID del usuario actual
   - `closed_notes`: Notas de cierre proporcionadas
3. **Confirmar éxito**: Mostrar mensaje de éxito.

---

### 5. Selector de Proyecto

**Propósito:** Cambiar contexto de trabajo entre proyectos asignados.

| Componente | Descripción | Servicio Supabase | Objetivo |
|------------|-------------|-------------------|----------|
| Lista de proyectos | Solo proyectos donde estoy asignado | **Data API** - project_members | Obj 2 |
| Proyecto activo | Persistir selección | Local (SharedPreferences) | - |
| Filtro por estado | ACTIVE, PAUSED, COMPLETED | **Data API** | Obj 2 |

#### Flujo de Datos: Consulta de Proyectos Asignados

1. **Consultar tabla `project_members`**: Seleccionar con relación anidada a tabla `projects`.
2. **Filtro de usuario**: Restringir estrictamente a registros donde `user_id` es igual al ID del usuario actual.
3. **Filtro de estado**: Adicionalmente filtrar donde el `status` del proyecto relacionado es estrictamente 'ACTIVE'.
4. **Resultado**: Lista de proyectos con todos sus campos donde el usuario está asignado.

---

### 6. Perfil y Configuración

**Propósito:** Ver información del usuario y ajustes de la app.

| Sección | Descripción | Servicio Supabase | Objetivo |
|---------|-------------|-------------------|----------|
| Mi perfil | Nombre, email, foto, rol | **Data API** - users | - |
| Editar foto | Subir avatar | **Storage** - org-assets | - |
| Notificaciones | Toggle notificaciones | **Realtime** (Supabase) | Obj 3 |
| Tema | Light/Dark mode | Local (SharedPreferences) | - |
| Cerrar sesión | Logout | **Auth** - signOut | - |

---

## 📴 MODO OFFLINE (Crítico para Campo)

### Estrategia de Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE QUEUE                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │ SQLite      │────▶│ Sync        │────▶│ Supabase    │   │
│  │ Local DB    │     │ Manager     │     │ Cloud       │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                             │                               │
│                    ┌────────┴────────┐                      │
│                    │ Connectivity    │                      │
│                    │ Listener        │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Operaciones Offline Soportadas:**

| Operación | Comportamiento Offline | Sincronización |
|-----------|------------------------|----------------|
| Crear incidencia | Guardar en cola local | Al reconectar: INSERT + Upload fotos |
| Agregar comentario | Guardar en cola local | Al reconectar: INSERT |
| Ver incidencias | Cache local de última sync | Refrescar al reconectar |
| Ver fotos | Cache de imágenes | No requerir descarga |

#### Flujo de Datos: Sincronización Offline

1. **Escuchar cambios de conectividad**: Registrar listener para detectar cuando el dispositivo recupera conexión.
2. **Al detectar conexión**:
   - Obtener lista de operaciones pendientes de la base de datos local.
   - Para cada operación pendiente:
     - **Si es crear incidencia**: Ejecutar INSERT en tabla remota + Upload de fotos asociadas.
     - **Si es agregar comentario**: Ejecutar INSERT en tabla `comments`.
   - Si la operación tiene éxito: Marcar como sincronizada en DB local.
   - Si falla: Incrementar contador de reintentos para procesar en próxima sync.

#### Flujo de Datos: Sincronizar Incidencia Offline

1. **Decodificar payload**: Leer datos de incidencia almacenados localmente.
2. **Insertar incidencia**: Ejecutar INSERT en tabla `incidents` remota.
3. **Subir fotos pendientes**: Para cada path de foto local, ejecutar upload a Storage.
4. **Registrar fotos en DB**: Insertar registros en tabla `photos` con paths remotos.

**¿Por qué es crítico el modo offline?**
> Cumple el **Objetivo 1**: Las obras de construcción frecuentemente tienen mala señal (sótanos, zonas rurales, estructuras metálicas). Sin offline, el personal no podría reportar hasta salir de la obra.

---

## 🔔 NOTIFICACIONES EN TIEMPO REAL

### Arquitectura 100% Supabase

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Supabase        │────▶│ Realtime        │────▶│ Mobile Device   │
│ Database        │     │ Postgres       │     │ App en          │
│ INSERT/UPDATE   │     │ Changes        │     │ Primer Plano    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                              │
        │                                              ▼
        │                                     ┌─────────────────┐
        │                                     │ Notificación    │
        └─────────────────────────────────────│ Local/In-App    │
                                              └─────────────────┘
```

**Estrategia de Notificaciones MVP:**

El MVP utiliza **exclusivamente Supabase Realtime** para notificaciones. Cuando la app está en primer plano, escucha eventos de PostgreSQL y muestra notificaciones locales. No se requieren servicios externos como Firebase.

| Escenario | Comportamiento |
|-----------|----------------|
| App en primer plano | Supabase Realtime → Notificación local in-app |
| App en segundo plano | El usuario verá los cambios al volver a abrir la app |
| App cerrada | El usuario verá los cambios al abrir la app |

**Eventos que Disparan Notificaciones Realtime:**

| Evento DB | Canal Realtime | Filtro | Mensaje Local |
|-----------|----------------|--------|---------------|
| INSERT incident (CRITICAL) | `project-{id}-incidents` | `priority=eq.CRITICAL` | "🚨 Incidencia crítica reportada" |
| UPDATE incident (assigned_to) | `my-assignments` | `assigned_to=eq.{user_id}` | "📋 Te asignaron una incidencia" |
| INSERT comment | `incident-{id}-comments` | `incident_id=eq.{id}` | "💬 Nuevo comentario" |

#### Flujo de Datos: Suscripción a Asignaciones (Realtime)

1. **Al iniciar sesión**: Establecer suscripción al canal de cambios de PostgreSQL.
2. **Configurar filtro**: Escuchar eventos UPDATE en tabla `incidents` donde `assigned_to` es igual al `user_id` del JWT.
3. **Al recibir evento**:
   - Verificar si el valor anterior de `assigned_to` era diferente (es nueva asignación).
   - Mostrar notificación local in-app con título "📋 Nueva Asignación".
   - Actualizar lista de incidencias asignadas en el estado local.
4. **Mantener conexión**: La suscripción permanece activa mientras la app esté en primer plano.

#### Flujo de Datos: Suscripción a Incidencias Críticas

1. **Al seleccionar proyecto**: Establecer suscripción al canal `project-{projectId}-incidents`.
2. **Configurar filtro**: Escuchar eventos INSERT en tabla `incidents` donde `project_id` coincide y `priority` = 'CRITICAL'.
3. **Al recibir evento**:
   - Mostrar notificación destacada con icono de alerta.
   - Reproducir sonido de alerta (si está habilitado en configuración).
   - Agregar incidencia al inicio de la lista.

**¿Por qué Supabase Realtime en lugar de servicios externos?**
> Cumple el **Objetivo 3**: Supabase Realtime es nativo del backend que ya usamos. No requiere configurar Firebase, Google Cloud, ni Apple Developer Program. Simplifica la arquitectura y reduce costos.

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### JWT Claims en Mobile

El token JWT contiene custom claims inyectados por el hook `custom_access_token_hook`:

| Claim | Tipo | Descripción | Ejemplo | Uso en Mobile |
|-------|------|-------------|---------|---------------|
| `sub` | STRING | ID del usuario en auth.users | "a1b2c3..." | Interno de Supabase |
| `role` | STRING | Rol de Supabase | "authenticated" | Validar autenticación |
| `user_role` | STRING | Rol de negocio STROP | "RESIDENT" | Mostrar/ocultar botones según permisos |
| `org_id` | STRING (UUID) | ID del tenant (organización) | "org-uuid" | RLS automático en queries |
| `user_id` | STRING (UUID) | ID en tabla public.users | "user-uuid" | Filtrar "mis incidencias", identificar autor |

#### Flujo de Datos: Acceder a Claims

```
1. Obtener sesión actual del cliente Supabase
2. Extraer access_token de la sesión
3. Decodificar JWT (base64) para obtener payload
4. Leer campos: user_role, org_id, user_id
5. Almacenar en estado global para decisiones de UI
```

**Ejemplo de payload decodificado:**

```json
{
  "sub": "auth-user-uuid",
  "role": "authenticated",
  "user_role": "RESIDENT",
  "org_id": "organization-uuid",
  "user_id": "user-uuid",
  "exp": 1704067200,
  "iat": 1704063600
}
```

### Permisos en App por Rol

| Acción | OWNER | SUPERINTENDENT | RESIDENT | CABO | Validación |
|--------|:-----:|:--------------:|:--------:|:----:|------------|
| Ver Home (mis incidencias) | ✅ | ✅ | ✅ | ✅ | - |
| Crear incidencia | ✅ | ✅ | ✅ | ✅ | RLS permite INSERT a todos |
| Ver detalle incidencia | ✅ | ✅ | ✅ | ✅ | RLS filtra por org_id |
| Agregar comentario | ✅ | ✅ | ✅ | ✅ | RLS permite INSERT a todos |
| Cerrar incidencia | ✅ | ✅ | ✅ | ❌ | `user_role != 'CABO'` en UI + RLS |
| Asignar incidencia | ✅ | ✅ | ✅ | ❌ | `user_role != 'CABO'` en UI + RLS |
| Ver todos los proyectos org | ✅ | ✅ | ❌ | ❌ | Solo via `project_members` para RESIDENT/CABO |

### Verificación de Permisos en UI

#### Para Cerrar Incidencia (RESIDENT+)

```
1. Obtener user_role del estado de autenticación
2. Verificar: user_role está en ['OWNER', 'SUPERINTENDENT', 'RESIDENT']
3. SI cumple: Mostrar botón "Cerrar Incidencia"
4. SI NO cumple: Ocultar botón (CABO no puede cerrar)
```

#### Para Asignar Incidencia (RESIDENT+)

```
1. Obtener user_role del estado de autenticación
2. Verificar: user_role está en ['OWNER', 'SUPERINTENDENT', 'RESIDENT']
3. SI cumple: Mostrar selector de asignación
4. SI NO cumple: Solo mostrar estado "Asignada a: [nombre]" sin edición
```

---

### RLS Policies que Afectan a Mobile

#### Operaciones INSERT (Crear)

| Tabla | Política | Condición | Resultado |
|-------|----------|-----------|-----------|
| `incidents` | Any role creates incidents | `org_id coincide` | ✅ Todos los roles pueden crear |
| `photos` | Upload photos | `org_id coincide` | ✅ Todos pueden subir fotos |
| `comments` | Add comments | `org_id coincide` | ✅ Todos pueden comentar |

#### Operaciones SELECT (Leer)

| Tabla | Política | Condición | Resultado |
|-------|----------|-----------|-----------|
| `incidents` | View org incidents | `org_id coincide` | Ve todas las incidencias de la org |
| `projects` | View org projects | `org_id coincide` | Ve todos los proyectos de la org |
| `project_members` | View org members | `org_id coincide` | Ve asignaciones de la org |
| `photos` | View org photos | `org_id coincide` | Ve fotos de incidencias de la org |
| `comments` | View org comments | `org_id coincide` | Ve comentarios de la org |

#### Operaciones UPDATE (Modificar)

| Tabla | Política | Condición | Resultado |
|-------|----------|-----------|-----------|
| `incidents` | Authorized roles update | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT', 'RESIDENT')` | Solo RESIDENT+ pueden cerrar/asignar |
| `incidents` | Creator updates own | `org_id coincide AND created_by = user_id AND status != 'CLOSED'` | Creador puede editar antes de cierre |

---

## 📊 SERVICIOS SUPABASE - USO EN APP

### 1. Database (PostgreSQL)

| Uso en App | Descripción | Tablas Involucradas |
|------------|-------------|---------------------|
| Lectura de datos | Mis incidencias, proyectos asignados | incidents, project_members, projects |
| Escritura de datos | Crear incidencias, comentarios | incidents, comments, photos |
| Offline sync | Queue de operaciones pendientes | Todas (via local DB) |

### 2. Authentication

| Uso en App | Descripción |
|------------|-------------|
| Email/Password Login | Único método MVP |
| Session Persistence | SecureStorage (token refresh) |
| Custom Claims | org_id, user_role, user_id en JWT |
| Auto-refresh | Token refresh automático |

### 3. Storage

| Bucket | Uso en App | Características |
|--------|------------|-----------------|
| `incident-photos` | Upload de fotos de incidencias | Resumable, compresión, cache local |
| `org-assets` | Foto de perfil | Público |

### 4. Realtime

| Canal | Tabla | Evento | Filtro | Uso en App |
|-------|-------|--------|--------|------------|
| `my-assignments` | incidents | UPDATE | `assigned_to=eq.{user_id}` | Notificar nuevas asignaciones |
| `incident-{id}-comments` | comments | INSERT | `incident_id=eq.{id}` | Thread de comentarios en vivo |
| `project-{id}-incidents` | incidents | INSERT | `project_id=eq.{id}` | Actualizar lista de incidencias |
| `incident-{id}-photos` | photos | INSERT | `incident_id=eq.{id}` | Galería en tiempo real |

#### Configuración de Suscripciones

```
Canal: realtime:public:incidents
Eventos: INSERT, UPDATE
Filtro RLS: Automático por org_id (del JWT)
```

**Patrón de Suscripción para Asignaciones:**

```
1. Obtener user_id del JWT
2. Suscribirse a canal "incidents"
3. Filtrar por: event=UPDATE, column=assigned_to, value=user_id
4. Al recibir evento: Mostrar notificación local + actualizar lista
```

**Patrón de Suscripción para Comentarios:**

```
1. En vista de detalle de incidencia
2. Suscribirse a canal "comments" filtrado por incident_id
3. Al recibir INSERT: Agregar comentario a la lista sin refresh
4. Al salir de vista: Cancelar suscripción
```

### 5. Data API (PostgREST)

| Tipo de Query | Endpoint | Filtros Comunes |
|---------------|----------|-----------------|
| Mis incidencias | `GET /incidents` | `assigned_to=eq.{user_id}` o `created_by=eq.{user_id}` |
| Incidencias del proyecto | `GET /incidents` | `project_id=eq.{id}&order=created_at.desc` |
| Crear incidencia | `POST /incidents` | Body con campos requeridos |
| Cerrar incidencia | `PATCH /incidents` | `?id=eq.{id}`, Body: `{status: 'CLOSED'}` |
| Agregar comentario | `POST /comments` | Body con incident_id y content |

### 6. Storage Policies para Mobile

| Bucket | Operación | Policy | Condición |
|--------|-----------|--------|-----------|
| `incident-photos` | SELECT | `View org incident photos` | Via JOIN incidents, mismo org_id |
| `incident-photos` | INSERT | `Upload incident photos` | Validar org_id y max 5 por incidencia |
| `incident-photos` | DELETE | Ninguna | ❌ No se pueden eliminar fotos |

#### Flujo de Upload de Foto

```
1. Capturar/seleccionar imagen
2. Comprimir: 80% calidad JPEG, max 1920px largo
3. Generar nombre: {org_id}/{incident_id}/{uuid}.jpg
4. Verificar conteo actual de fotos (<5)
5. Upload con resumable si >1MB
6. Insertar registro en tabla photos con storage_path
7. Cache local para acceso rápido
```

### 7. Edge Functions

| Función | Propósito | Trigger | Parámetros |
|---------|-----------|---------|------------|
| `send-invitation-email` | Enviar emails de invitación | INSERT en `invitations` | email, org_name, inviter_name |

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Core (Semana 1-2)

- [ ] Setup framework mobile + Supabase SDK
- [ ] Auth: Login/Logout con persistencia
- [ ] Home básico (lista de incidencias)
- [ ] Selector de proyecto

### Fase 2: Crear Incidencia (Semana 3)

- [ ] Flujo wizard paso a paso
- [ ] Captura de fotos (cámara + galería)
- [ ] Compresión de imágenes
- [ ] Upload a Storage

### Fase 3: Detalle + Comentarios (Semana 4)

- [ ] Vista de detalle completa
- [ ] Galería de fotos
- [ ] Thread de comentarios
- [ ] Realtime para comentarios

### Fase 4: Offline Mode (Semana 5)

- [ ] Base de datos local (SQLite o equivalente)
- [ ] Queue de operaciones pendientes
- [ ] Sync automático al reconectar
- [ ] Cache de imágenes

### Fase 5: Notificaciones Realtime (Semana 6)

- [ ] Suscripción a canal de asignaciones
- [ ] Suscripción a incidencias críticas
- [ ] Notificaciones locales in-app
- [ ] Handling de deep links

---

## 📚 REFERENCIAS

- Ver `STROP_WEB_PLATFORM.md` para especificación de la plataforma web
- Ver `STROP_INTEGRATION.md` para integración web-app
- Ver `supabase-strop-schema.sql` para schema de base de datos
- Ver `REQUIREMENTS_MVP.md` para requerimientos de negocio

---

## 🔧 CONSIDERACIONES TÉCNICAS

### Performance en Campo

| Consideración | Solución |
|---------------|----------|
| Conexión lenta | Resumable uploads, compresión de fotos |
| Batería limitada | Minimizar polling, usar push en lugar de pull |
| Almacenamiento | Limpiar cache de fotos antiguas (>7 días) |
| CPU móvil | Compresión de imágenes en background thread |

### Compatibilidad

| Plataforma | Versión Mínima |
|------------|----------------|
| Android | 6.0 (API 23) |
| iOS | 13.0 |

### Tamaño de la App

| Componente | Tamaño Estimado |
|------------|-----------------|
| Framework base | ~15-20MB |
| Supabase SDK | ~2MB |
| DB Local | ~3MB |
| **Total** | ~20-25MB |
