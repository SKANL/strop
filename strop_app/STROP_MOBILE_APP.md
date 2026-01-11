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
| `incidents` | CREATE, READ, UPDATE | `project_id`, `type`, `description`, `priority` (status='OPEN' auto) | `status`, `closed_at`, `closed_by`, `closed_notes` |
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
| `description` | TEXT (max 1000) | CREATE | Descripción del problema |
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
4. **Extraer custom claims**: Decodificar el JWT para obtener:
   - `org_id`: ID del tenant (organización)
   - `user_role`: Rol de negocio (RESIDENT, CABO, etc.)
   - `user_id`: ID en tabla public.users
5. **Persistir sesión**: Almacenar tokens en storage seguro del dispositivo para auto-login futuro.

**¿Por qué persistir sesión?**
> Cumple el **Objetivo 1**: El personal de campo no debe perder tiempo re-autenticándose cada vez que abre la app. La sesión persiste hasta logout o expiración.

---

### 2. Home - Mis Incidencias

**Propósito:** Vista principal con incidencias relevantes para el usuario.

| Tab | Descripción | Servicio Supabase | Objetivo |
|-----|-------------|-------------------|----------|
| **Asignadas a mí** | Incidencias que debo resolver | **Data API** - filter assigned_to | Obj 3 |
| **Creadas por mí** | Mis reportes y su estado | **Data API** - filter created_by | Obj 1 |
| **Proyecto actual** | Todas las incidencias del proyecto | **Data API** + **Realtime** | Obj 2 |

#### Flujo de Datos: Consulta de Incidencias Asignadas

1. **Consultar tabla `incidents`**: Seleccionar todos los campos más datos relacionados del proyecto.
2. **Filtro de asignación**: Restringir estrictamente a registros donde `assigned_to` es igual al ID del usuario actual.
3. **Excluir cerradas**: Filtrar donde `status` es distinto de 'CLOSED'.
4. **Ordenamiento doble**:
   - Primero por `priority` en orden descendente (CRÍTICAS primero)
   - Luego por `created_at` en orden descendente (más recientes primero)

#### Flujo de Datos: Suscripción Realtime para Nuevas Asignaciones

1. **Establecer canal**: Crear suscripción a cambios de PostgreSQL.
2. **Evento monitoreado**: Escuchar exclusivamente eventos UPDATE en tabla `incidents`.
3. **Filtro estricto**: Restringir a registros donde `assigned_to` es igual al ID del usuario actual.
4. **Al recibir evento**:
   - Mostrar notificación local: "Nueva incidencia asignada"
   - Refrescar lista de incidencias asignadas

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
   - `description`: Texto descriptivo
   - `priority`: Prioridad (NORMAL o CRITICAL)
   - `status`: Siempre 'OPEN' para nuevas
   - Nota: `organization_id` y `created_by` se establecen automáticamente via trigger/RLS
5. **Registrar fotos en DB**: Para cada foto subida, insertar en tabla `photos` con:
   - `incident_id`: ID de la incidencia recién creada
   - `storage_path`: Ruta en Storage
   - `organization_id`: ID del tenant
6. **Confirmar éxito**: Mostrar mensaje y navegar a Home.

#### Flujo de Datos: Upload de Fotos (Resumable)

1. **Comprimir imagen**: Reducir calidad a 80% y ancho máximo a 1920px.
2. **Generar path único**: Estructura: `{org_id}/{project_id}/{incident_id}/{uuid}.jpg`
3. **Upload resumable**: Subir binario a bucket `incident-photos` con tipo MIME `image/jpeg`.
4. **Retornar path**: Devolver el path para registrar en base de datos.

**¿Por qué Resumable Upload?**
> Cumple el **Objetivo 1**: En obras de construcción la señal de internet puede ser intermitente. El upload resumable permite pausar y continuar la subida sin perder progreso.

**¿Por qué compresión de imágenes?**
> Cumple el **Objetivo 1**: Fotos de 12MP del teléfono son ~5MB. Comprimir a 1920px y 80% quality reduce a ~200KB sin pérdida visual significativa. Subida más rápida + menor uso de cuota de storage.

---

### 4. Detalle de Incidencia

**Propósito:** Ver información completa y agregar comentarios/cierre.

| Sección | Descripción | Servicio Supabase | Objetivo |
|---------|-------------|-------------------|----------|
| Header | Tipo, prioridad, estado, fecha | **Data API** - incident data | Obj 2 |
| Descripción | Texto completo | **Data API** | Obj 2 |
| Galería de fotos | Carousel de imágenes | **Storage** - Signed URLs | Obj 1 |
| Comentarios | Thread de discusión | **Realtime** + **Data API** | Obj 3 |
| Acciones | Cerrar (si soy RESIDENT+) | **Data API** - UPDATE | Obj 3 |

#### Flujo de Datos: Suscripción Realtime para Comentarios

1. **Establecer canal**: Crear suscripción específica para la incidencia actual.
2. **Evento monitoreado**: Escuchar exclusivamente eventos INSERT en tabla `comments`.
3. **Filtro estricto**: Restringir a registros donde `incident_id` es igual al ID de la incidencia visualizada.
4. **Al recibir evento**:
   - Parsear el nuevo comentario del payload
   - Agregar al estado local de comentarios para actualizar UI inmediatamente

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
