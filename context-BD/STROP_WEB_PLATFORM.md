# 🖥️ STROP WEB PLATFORM - Especificación Funcional

> **Versión:** 1.1 MVP (Stack Agnóstico)
> **Última actualización:** Enero 10, 2026
> **Audiencia:** Product Managers, Arquitectos, Desarrolladores
> **Complemento:** Ver `STROP_MOBILE_APP.md` y `STROP_INTEGRATION.md`

---

## 📋 RESUMEN EJECUTIVO

La plataforma web de STROP está diseñada para **Dueños/Administradores (D/A)** de empresas constructoras. Proporciona visibilidad ejecutiva, gestión de proyectos/usuarios, y generación de documentos legales (Bitácora BESOP).

### Rol en el Ecosistema

| Aspecto | Descripción |
|---------|-------------|
| **¿Quién la usa?** | D/A (OWNER, SUPERINTENDENT) - Perfil oficina/escritorio |
| **¿Desde dónde?** | Navegador web (desktop/tablet) |
| **¿Para qué?** | Monitorear KPIs, gestionar equipo, generar reportes legales |
| **Complemento con App** | Consume datos creados en campo por la app móvil |

---

## 🎯 OBJETIVOS DE NEGOCIO CUBIERTOS

### Objetivo 1: Agilizar la captura de información en campo
>
> **Rol de la Web:** Consumidor de datos

| Característica Web | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Dashboard en tiempo real | Muestra incidencias creadas desde campo instantáneamente | **Realtime** (Postgres Changes) |
| Vista de fotos de incidencias | Visualiza evidencia fotográfica capturada en obra | **Storage** (Buckets privados) |
| Historial de incidencias | Consulta registros históricos creados en campo | **Data API** (PostgREST) |

### Objetivo 2: Centralizar y organizar el flujo de incidencias
>
> **Rol de la Web:** Centro de Control

| Característica Web | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Dashboard con KPIs | Clasifica automáticamente por estado/urgencia/proyecto | **Database** (Views + Aggregations) |
| Filtros avanzados | Permite buscar por tipo, fecha, proyecto, responsable | **Data API** (Filtros PostgREST) |
| Gestión de proyectos | Organiza incidencias por obra | **Database** (FK + RLS) |
| Asignación de miembros | Vincula personal a proyectos específicos | **Database** (project_members) |

### Objetivo 3: Acelerar la toma de decisiones
>
> **Rol de la Web:** Centro de Comando

| Característica Web | Cómo cumple el objetivo | Servicio Supabase |
|-------------------|------------------------|-------------------|
| Notificaciones en vivo | D/A ve incidencias críticas al instante | **Realtime** (filter: priority=CRITICAL) |
| Asignación rápida | Permite asignar responsables en 2 clics | **Data API** (UPDATE incidents) |
| Bitácora unificada | Timeline cronológico para decisiones informadas | **Database** (bitacora_timeline VIEW) |
| OfficialComposer | Genera borradores legales en minutos, no horas | **Database** + **Edge Functions** |

---

## 🏗️ ARQUITECTURA TÉCNICA

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND WEB                            │
│  (Framework SSR/SPA con componentes interactivos)           │
│  - Renderizado en servidor para SEO y performance           │
│  - Componentes interactivos para funcionalidad dinámica     │
│  - Gestión de estado para datos reactivos                   │
│  - Autenticación con cookies HTTPOnly (SSR)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Auth        │ │ Database    │ │ Realtime                ││
│  │ - Email/Pwd │ │ - PostgreSQL│ │ - Postgres Changes      ││
│  │ - JWT Hook  │ │ - RLS       │ │ - Broadcast             ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Storage     │ │ Data API    │ │ Edge Functions          ││
│  │ - Photos    │ │ - PostgREST │ │ - Database Webhooks     ││
│  │ - Assets    │ │             │ │ - Push Notifications    ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 MODELO DE DATOS MVP

### Tablas del Sistema (11 tablas)

#### 1. `organizations` - Tenant Raíz (Multi-tenant)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `name` | VARCHAR(255) | NO | - | Nombre de la empresa constructora |
| `slug` | VARCHAR(100) | NO | - | Identificador URL-friendly (único, regex: `^[a-z0-9-]+$`) |
| `logo_url` | VARCHAR(500) | SÍ | NULL | URL del logo en Storage |
| `billing_email` | VARCHAR(255) | SÍ | NULL | Email de facturación |
| `storage_quota_mb` | INTEGER | NO | 5000 | Cuota de almacenamiento (5GB default) |
| `max_users` | INTEGER | NO | 50 | Máximo de usuarios permitidos |
| `max_projects` | INTEGER | NO | 100 | Máximo de proyectos permitidos |
| `plan` | subscription_plan | NO | 'STARTER' | Plan de suscripción |
| `is_active` | BOOLEAN | NO | TRUE | Si el tenant está activo |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Última actualización |

#### 2. `users` - Usuarios del Sistema

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `auth_id` | UUID | SÍ | NULL | FK a auth.users (ON DELETE SET NULL para soft delete) |
| `organization_id` | UUID | NO | - | FK a organizations (ON DELETE CASCADE) |
| `email` | VARCHAR(255) | NO | - | Email del usuario |
| `full_name` | VARCHAR(255) | NO | - | Nombre completo |
| `profile_picture_url` | VARCHAR(500) | SÍ | NULL | URL de foto de perfil |
| `role` | user_role | NO | - | Rol en la organización |
| `is_active` | BOOLEAN | NO | TRUE | Si el usuario está activo |
| `deleted_at` | TIMESTAMPTZ | SÍ | NULL | Timestamp de soft delete (NULL = activo) |
| `deleted_by` | UUID | SÍ | NULL | Quién eliminó al usuario |
| `theme_mode` | TEXT | NO | 'light' | Preferencia de tema ('light' o 'dark') |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Última actualización |

**Constraint único**: `(email, organization_id)` - Un email puede existir en múltiples orgs.

#### 3. `invitations` - Sistema de Invitaciones

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations |
| `email` | TEXT | NO | - | Email del invitado |
| `role` | user_role | NO | - | Rol asignado (NO puede ser 'OWNER') |
| `invited_by` | UUID | SÍ | NULL | FK a users (quién invitó) |
| `invitation_token` | TEXT | NO | gen_random_uuid() | Token único para la invitación |
| `expires_at` | TIMESTAMPTZ | NO | NOW() + 24 hours | Fecha de expiración |
| `accepted_at` | TIMESTAMPTZ | SÍ | NULL | Cuándo fue aceptada |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

**Constraints**:

- `(email, organization_id)` único
- `role != 'OWNER'` (OWNER solo se asigna al crear org)
- `expires_at > created_at`

#### 4. `projects` - Obras de Construcción

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations |
| `name` | VARCHAR(255) | NO | - | Nombre del proyecto |
| `location` | VARCHAR(255) | NO | - | Ubicación de la obra |
| `start_date` | DATE | NO | - | Fecha de inicio |
| `end_date` | DATE | NO | - | Fecha de fin planificada |
| `status` | project_status | NO | 'ACTIVE' | Estado del proyecto |
| `owner_id` | UUID | SÍ | NULL | FK a users (Superintendente responsable) |
| `created_by` | UUID | SÍ | NULL | FK a users (quién creó) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Última actualización |

**Constraint**: `end_date >= start_date`

#### 5. `project_members` - Asignación Usuario-Proyecto

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations (para RLS) |
| `project_id` | UUID | NO | - | FK a projects |
| `user_id` | UUID | NO | - | FK a users |
| `assigned_role` | project_role | NO | - | Rol en ESTE proyecto |
| `assigned_at` | TIMESTAMPTZ | NO | NOW() | Cuándo fue asignado |
| `assigned_by` | UUID | SÍ | NULL | FK a users (quién asignó) |

**Constraints**:

- `(project_id, user_id)` único
- `assigned_role != 'OWNER'` (OWNER gestiona a nivel org)

#### 6. `incidents` - Incidencias (CORE del negocio)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations (para RLS) |
| `project_id` | UUID | NO | - | FK a projects |
| `type` | incident_type | NO | - | Tipo de incidencia |
| `title` | VARCHAR(255) | NO | - | Título resumido de la incidencia |
| `description` | TEXT | NO | - | Descripción detallada (max 1000 chars) |
| `location` | VARCHAR(255) | SÍ | NULL | Ubicación específica en la obra |
| `priority` | incident_priority | NO | 'NORMAL' | Prioridad (NORMAL o CRITICAL) |
| `status` | incident_status | NO | 'OPEN' | Estado actual (OPEN → ASSIGNED → CLOSED) |
| `created_by` | UUID | SÍ | NULL | FK a users (quién reportó) |
| `assigned_to` | UUID | SÍ | NULL | FK a users (responsable asignado) |
| `closed_at` | TIMESTAMPTZ | SÍ | NULL | Cuándo se cerró |
| `closed_by` | UUID | SÍ | NULL | FK a users (quién cerró) |
| `closed_notes` | TEXT | SÍ | NULL | Notas de cierre o resolución (max 1000 chars) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

**Constraints**:

- `char_length(description) <= 1000`
- `char_length(closed_notes) <= 1000`

#### 7. `photos` - Fotos de Incidencias

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations (para RLS) |
| `incident_id` | UUID | NO | - | FK a incidents |
| `storage_path` | VARCHAR(500) | NO | - | Path en Storage: `{org_id}/{project_id}/{incident_id}/{uuid}.jpg` |
| `uploaded_by` | UUID | SÍ | NULL | FK a users |
| `uploaded_at` | TIMESTAMPTZ | NO | NOW() | Fecha de subida |

**Validación via trigger**: Máximo 5 fotos por incidencia.

#### 8. `comments` - Comentarios en Incidencias

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations (para RLS) |
| `incident_id` | UUID | NO | - | FK a incidents |
| `author_id` | UUID | SÍ | NULL | FK a users |
| `text` | TEXT | NO | - | Contenido del comentario (max 1000 chars) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

**Constraint**: `char_length(text) <= 1000`

#### 9. `bitacora_entries` - Entradas Manuales de Bitácora

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations |
| `project_id` | UUID | NO | - | FK a projects |
| `source` | event_source | NO | 'MANUAL' | Fuente del evento (ALL, INCIDENT, MANUAL, MOBILE, SYSTEM) |
| `title` | VARCHAR(255) | NO | - | Título de la entrada |
| `content` | TEXT | NO | - | Contenido detallado de la entrada |
| `metadata` | JSONB | NO | '{}' | Metadata flexible para datos adicionales |
| `incident_id` | UUID | SÍ | NULL | FK a incidents (si la entrada está relacionada) |
| `created_by` | UUID | SÍ | NULL | FK a users (quién creó la entrada) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha de creación |
| `is_locked` | BOOLEAN | NO | FALSE | Si está bloqueada por cierre de día |
| `locked_at` | TIMESTAMPTZ | SÍ | NULL | Cuándo se bloqueó (solo lectura) |
| `locked_by` | UUID | SÍ | NULL | FK a users (quién bloqueó) |

#### 10. `bitacora_day_closures` - Cierres Diarios Inmutables

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations |
| `project_id` | UUID | NO | - | FK a projects |
| `closure_date` | DATE | NO | - | Fecha del cierre |
| `official_content` | TEXT | NO | - | Contenido oficial generado |
| `pin_hash` | VARCHAR(256) | SÍ | NULL | Hash del PIN de verificación |
| `closed_by` | UUID | SÍ | NULL | FK a users |
| `closed_at` | TIMESTAMPTZ | NO | NOW() | Cuándo se cerró |

**Constraint único**: `(project_id, closure_date)` - Solo un cierre por día por proyecto.

#### 11. `audit_logs` - Registro de Auditoría

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Identificador único |
| `organization_id` | UUID | NO | - | FK a organizations |
| `table_name` | TEXT | NO | - | Nombre de la tabla afectada |
| `record_id` | UUID | SÍ | NULL | ID del registro afectado |
| `action` | TEXT | NO | - | Tipo: 'INSERT', 'UPDATE', 'DELETE' |
| `old_data` | JSONB | SÍ | NULL | Datos antes del cambio |
| `new_data` | JSONB | SÍ | NULL | Datos después del cambio |
| `user_id` | UUID | SÍ | NULL | FK a users |
| `user_role` | TEXT | SÍ | NULL | Rol del usuario al momento |
| `ip_address` | INET | SÍ | NULL | IP del cliente |
| `user_agent` | TEXT | SÍ | NULL | User-Agent del cliente |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Fecha del evento |

---

### ENUMs del Sistema (8 tipos)

| ENUM | Valores | Descripción |
|------|---------|-------------|
| `subscription_plan` | 'STARTER', 'PROFESSIONAL', 'ENTERPRISE' | Plan de suscripción de la organización |
| `user_role` | 'OWNER', 'SUPERINTENDENT', 'RESIDENT', 'CABO' | Jerarquía: OWNER (nivel 4) > SUPERINTENDENT (3) > RESIDENT (2) > CABO (1) |
| `project_status` | 'ACTIVE', 'PAUSED', 'COMPLETED' | Estado del proyecto |
| `project_role` | 'SUPERINTENDENT', 'RESIDENT', 'CABO' | Roles asignables a proyectos (OWNER no se asigna a proyectos) |
| `incident_type` | 'ORDER_INSTRUCTION', 'REQUEST_QUERY', 'CERTIFICATION', 'INCIDENT_NOTIFICATION' | Tipos conforme a normativa mexicana de bitácora |
| `incident_priority` | 'NORMAL', 'CRITICAL' | Prioridad de atención |
| `incident_status` | 'OPEN', 'ASSIGNED', 'CLOSED' | Flujo: OPEN → ASSIGNED → CLOSED |
| `event_source` | 'ALL', 'INCIDENT', 'MANUAL', 'MOBILE', 'SYSTEM' | Fuente del evento para filtros de bitácora |

### Detalle de Tipos de Incidencia

| Valor ENUM | Etiqueta UI | Descripción | Icono |
|------------|-------------|-------------|-------|
| `ORDER_INSTRUCTION` | Órdenes e Instrucciones | Directivas de trabajo, cambios de alcance, instrucciones específicas | 📋 |
| `REQUEST_QUERY` | Solicitudes y Consultas | Preguntas, aclaraciones, solicitudes de información o materiales | ❓ |
| `CERTIFICATION` | Certificaciones | Validaciones, aprobaciones, conformidades, certificados de calidad | ✅ |
| `INCIDENT_NOTIFICATION` | Notificaciones de Incidentes | Problemas, fallas, accidentes, situaciones que requieren atención inmediata | ⚠️ |

---

### Storage Buckets (2 buckets)

| Bucket | Público | Límite | Tipos MIME | Uso | Estructura de Path |
|--------|---------|--------|------------|-----|-------------------|
| `incident-photos` | ❌ Privado | 5MB/archivo | image/jpeg, image/png, image/webp | Fotos de incidencias | `{org_id}/{project_id}/{incident_id}/{uuid}.jpg` |
| `org-assets` | ✅ Público | 2MB/archivo | image/jpeg, image/png, image/webp, image/svg+xml | Logos, avatares | `{org_id}/logo.png`, `{org_id}/users/{user_id}/avatar.jpg` |

**Políticas de Storage:**

- Upload a `incident-photos`: Solo usuarios autenticados de la misma organización
- Delete de `incident-photos`: Solo el uploader o OWNER
- Upload a `org-assets`: Solo OWNER de la organización
- Read de `org-assets`: Público (logos visibles sin autenticación)

---

### Vista Unificada: `bitacora_timeline`

```sql
-- Estructura de la vista (UNION ALL de 3 fuentes)
SELECT
    'INCIDENT' AS event_source,
    id, project_id, organization_id,
    created_at AS event_date,
    created_by AS event_user,
    jsonb_build_object(
        'type', type, 'description', description,
        'status', status, 'priority', priority,
        'assigned_to', assigned_to
    ) AS event_data
FROM incidents

UNION ALL

SELECT 'INCIDENT', c.id, i.project_id, c.organization_id,
    c.created_at, c.author_id,
    jsonb_build_object('incident_id', c.incident_id, 'text', c.text, 'parent_type', 'comment')
FROM comments c
INNER JOIN incidents i ON i.id = c.incident_id

UNION ALL

SELECT source, id, project_id, organization_id,
    created_at, created_by,
    jsonb_build_object('title', title, 'content', content)
FROM bitacora_entries

ORDER BY event_date DESC;
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `event_source` | event_source | Origen: 'INCIDENT', 'MANUAL', etc. |
| `id` | UUID | ID del evento |
| `project_id` | UUID | Proyecto relacionado |
| `organization_id` | UUID | Organización (para RLS) |
| `event_date` | TIMESTAMPTZ | Fecha/hora del evento |
| `event_user` | UUID | Usuario que generó el evento |
| `event_data` | JSONB | Datos específicos del evento |

**Performance**: Esta vista es ~95% más rápida que hacer 3 queries separadas + merge en frontend.

---

### Funciones RPC Disponibles

| Función | Parámetros | Retorno | Descripción | Permisos |
|---------|------------|---------|-------------|----------|
| `get_user_org_id()` | - | UUID | Obtiene `org_id` del JWT actual | Todos |
| `get_user_role()` | - | TEXT | Obtiene `user_role` del JWT actual | Todos |
| `has_role_or_higher(required_role TEXT)` | role a verificar | BOOLEAN | Verifica si usuario tiene rol >= requerido | Todos |
| `get_current_user_id()` | - | UUID | Obtiene `user_id` del JWT actual | Todos |
| `soft_delete_user(user_id_to_delete UUID)` | UUID del usuario | VOID | Elimina usuario preservando trazabilidad | Solo OWNER |

**Ejemplo de uso de `soft_delete_user`:**

```sql
-- Solo OWNER puede ejecutar, valida misma org, no permite auto-eliminación
SELECT soft_delete_user('user-uuid-to-delete');
```

---

### Triggers Automáticos

| Trigger | Tabla | Evento | Función | Descripción |
|---------|-------|--------|---------|-------------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` | Crea perfil y org/acepta invitación |
| `update_*_updated_at` | organizations, users, projects | BEFORE UPDATE | `update_updated_at_column()` | Actualiza timestamp |
| `validate_photo_count` | photos | BEFORE INSERT | `validate_incident_photo_count()` | Limita a 5 fotos/incidencia |
| `audit_*_changes` | incidents, projects, users, closures | AFTER INSERT/UPDATE/DELETE | `create_audit_log()` | Registra cambios en audit_logs |

---

### Índices Optimizados (Críticos para Performance)

| Tabla | Índice | Tipo | Descripción |
|-------|--------|------|-------------|
| `incidents` | `idx_incidents_org_status` | Compuesto | Queries de dashboard por org + estado |
| `incidents` | `idx_incidents_project_status_created` | Compuesto | Lista de incidencias por proyecto |
| `incidents` | `idx_incidents_org_status_priority` | Compuesto | Filtrar críticas por org |
| `incidents` | `idx_incidents_assigned_status` | Parcial | Incidencias asignadas (WHERE assigned_to IS NOT NULL) |
| `users` | `idx_users_deleted_at` | Parcial | Usuarios activos (WHERE deleted_at IS NULL) |
| `invitations` | `idx_invitations_expires_at` | Parcial | Invitaciones pendientes (WHERE accepted_at IS NULL) |

---

## �📱 PÁGINAS Y FUNCIONALIDADES

### 1. `/dashboard` - Panel Ejecutivo

**Propósito:** Vista rápida del estado general de incidencias.

| Componente | Descripción | Servicio Supabase | Objetivo |
|------------|-------------|-------------------|----------|
| KPI Cards | 4 métricas principales (Abiertas, Asignadas, Cerradas, Críticas) | **Data API** - Aggregation queries | Obj 2 |
| Activity Feed | Lista de últimas incidencias | **Realtime** - Postgres Changes en `incidents` | Obj 3 |
| Critical Alert Banner | Alerta visual cuando hay incidencias CRITICAL | **Realtime** - filter `priority=eq.CRITICAL` | Obj 3 |
| Projects Widget | Mini-lista de proyectos activos | **Data API** - SELECT con RLS | Obj 2 |

#### Flujo de Datos: Carga de KPIs

1. **Al cargar la página**, el frontend solicita a la tabla `incidents` un conteo agrupado por los campos `status` y `priority`.
2. El filtro RLS automáticamente restringe los resultados a registros donde `organization_id` coincide con el claim `org_id` del JWT del usuario.
3. El resultado devuelve agregaciones que permiten calcular: incidencias abiertas, asignadas, cerradas y críticas.

#### Flujo de Datos: Suscripción Realtime para Activity Feed

1. **Al montar el componente**, el frontend establece una suscripción al canal de cambios de PostgreSQL.
2. La suscripción escucha eventos de tipo INSERT, UPDATE y DELETE en la tabla `incidents`.
3. El filtro de la suscripción restringe estrictamente a registros donde `organization_id` es igual al `org_id` del usuario autenticado.
4. Cuando llega un evento (ej: nueva incidencia desde Mobile), el frontend:
   - Invalida la caché de queries de KPIs para forzar recálculo.
   - Agrega el nuevo registro al Activity Feed sin recargar la página.

**¿Por qué Realtime aquí?**
> Cumple el **Objetivo 3**: El D/A necesita ver las incidencias críticas reportadas desde campo al instante, sin refrescar la página. Esto permite tomar decisiones en tiempo real.

---

### 2. `/dashboard/proyectos` - Gestión de Proyectos

**Propósito:** CRUD de obras de construcción.

| Funcionalidad | Descripción | Servicio Supabase | Objetivo |
|---------------|-------------|-------------------|----------|
| Lista de proyectos | Tabla con filtros por estado | **Data API** - SELECT con paginación | Obj 2 |
| Crear proyecto | Formulario con validación | **Data API** - INSERT | Obj 2 |
| Editar proyecto | Modal de edición | **Data API** - UPDATE | Obj 2 |
| Ver detalle | Tabs: Overview, Incidencias, Miembros | **Data API** - JOINs | Obj 2 |

#### Flujo de Datos: Lista de Proyectos con Conteos

1. **Consulta principal**: Seleccionar todos los campos de la tabla `projects`.
2. **Subconsultas anidadas**: Para cada proyecto, incluir conteo de registros relacionados en `incidents` y `project_members`.
3. **Filtro de organización**: Restringir estrictamente a proyectos donde `organization_id` coincide con el tenant del usuario.
4. **Ordenamiento**: Ordenar por fecha de creación en orden descendente (más recientes primero).

**¿Por qué Data API aquí?**
> Cumple el **Objetivo 2**: La gestión de proyectos es operación CRUD estándar. No requiere tiempo real porque los proyectos se crean/editan esporádicamente.

---

### 3. `/dashboard/proyectos/[id]` - Detalle de Proyecto

**Propósito:** Vista completa de un proyecto con sus incidencias y equipo.

| Tab | Descripción | Servicio Supabase | Objetivo |
|-----|-------------|-------------------|----------|
| **Overview** | KPIs específicos del proyecto | **Data API** - Aggregations | Obj 2 |
| **Incidencias** | Lista filtrable de incidencias | **Data API** + **Realtime** | Obj 2, 3 |
| **Miembros** | Equipo asignado al proyecto | **Data API** - project_members | Obj 2 |

#### Flujo de Datos: Suscripción Realtime para Incidencias del Proyecto

1. **Establecer canal**: Crear suscripción específica para el proyecto actual.
2. **Evento monitoreado**: Escuchar exclusivamente eventos INSERT en la tabla `incidents`.
3. **Filtro estricto**: Restringir a registros donde `project_id` es igual al ID del proyecto visualizado.
4. **Al recibir evento**:
   - Mostrar notificación toast informando "Nueva incidencia reportada".
   - Invalidar caché de la lista de incidencias del proyecto para refrescar datos.

#### Flujo de Datos: Visualización de Fotos de Incidencia

1. **Consultar metadata**: Obtener los `storage_path` de la tabla `photos` filtrando estrictamente por `incident_id`.
2. **Generar URLs firmadas**: Para cada path, solicitar a Supabase Storage una URL firmada con tiempo de expiración de 3600 segundos (1 hora).
3. **Renderizar galería**: Mostrar las imágenes usando las URLs firmadas temporales.

**¿Por qué Storage con URLs firmadas?**
> Las fotos son **privadas** (evidencia sensible). Las URLs firmadas garantizan que solo usuarios autenticados de la organización pueden ver las fotos, y expiran después de un tiempo.

---

### 4. `/dashboard/bitacora` - Bitácora Operativa (Diferenciador)

**Propósito:** Centro de Verdad Única (CVU) con generación de documentos legales.

| Componente | Descripción | Servicio Supabase | Objetivo |
|------------|-------------|-------------------|----------|
| Timeline | Eventos cronológicos de múltiples fuentes | **Database** - `bitacora_timeline` VIEW | Obj 2 |
| Filtros por fuente | ALL, INCIDENT, MANUAL, MOBILE, SYSTEM | **Data API** - filter query | Obj 2 |
| OfficialComposer | Panel lateral para generar BESOP | **Database** + **Edge Functions** | Obj 2, 3 |
| Cierre de día | Inmutabilidad con PIN | **Database** - `bitacora_day_closures` | Obj 2 |

#### Flujo de Datos: Consulta a Vista Unificada del Timeline

1. **Seleccionar de VIEW**: Consultar la vista `bitacora_timeline` que unifica eventos de múltiples tablas.
2. **Filtrar por proyecto**: Restringir estrictamente a registros donde `project_id` coincide con el proyecto seleccionado.
3. **Rango de fechas**: Aplicar filtros `>= fecha_inicio` y `<= fecha_fin` sobre el campo `event_date`.
4. **Ordenamiento**: Ordenar por `event_date` en orden descendente (más recientes primero).

**¿Por qué una VIEW en Database?**
> Cumple el **Objetivo 2**: La bitácora agrega eventos de 3 tablas (incidents, comments, bitacora_entries). Hacer 3 queries + merge en frontend era 95% más lento. La VIEW `bitacora_timeline` hace el JOIN en PostgreSQL.

#### Flujo de Datos: OfficialComposer - Generación de Documento Legal

1. **Selección de eventos**: El usuario marca eventos del timeline que desea incluir en el documento oficial.
2. **Formateo legal**: Para cada evento seleccionado, generar texto estructurado con formato:
   - `[FECHA_EVENTO] TIPO_EVENTO: DESCRIPCIÓN_EVENTO`
   - Concatenar todos los textos con separadores de párrafo.
3. **Cierre de día con inmutabilidad**: Insertar en tabla `bitacora_day_closures` con:
   - `project_id`: ID del proyecto
   - `closure_date`: Fecha del cierre
   - `closed_by`: ID del usuario que cierra
   - `official_content`: Texto formateado generado
   - `generated_events`: Array de IDs de eventos incluidos

---

### 5. `/dashboard/usuarios` - Gestión de Usuarios

**Propósito:** CRUD de usuarios del tenant.

| Funcionalidad | Descripción | Servicio Supabase | Objetivo |
|---------------|-------------|-------------------|----------|
| Lista de usuarios | Tabla con filtros por rol/estado | **Data API** - SELECT con RLS | Obj 2 |
| Invitar usuario | Enviar invitación por email | **Auth** + **Database** (invitations) | Obj 2 |
| Editar usuario | Cambiar rol, activar/desactivar | **Data API** - UPDATE | Obj 2 |
| Soft delete | Eliminar usuario preservando trazabilidad | **Database** - `soft_delete_user()` | Obj 2 |

#### Flujo de Datos: Sistema de Invitaciones

1. **Generar token único**: Crear identificador UUID para la invitación.
2. **Insertar invitación**: Crear registro en tabla `invitations` con:
   - `organization_id`: Tenant al que se invita
   - `email`: Correo del invitado
   - `role`: Rol asignado (ej: 'RESIDENT')
   - `invitation_token`: Token generado
   - `invited_by`: ID del usuario que invita
   - `expires_at`: Fecha de expiración (típicamente 7 días desde creación)
3. **Envío de email**: La Edge Function `send-invitation-email` envía correo con link conteniendo el token de invitación.
4. **Aceptación**: Cuando el invitado accede al link, el sistema valida token, crea cuenta en Auth y vincula a la organización.

**¿Por qué sistema de invitaciones?**
> Resuelve el problema del "Lobo Solitario": Sin invitaciones, cada usuario que hace signup crearía su propia organización. Con invitaciones, el nuevo usuario se une a la organización existente.

---

### 6. `/dashboard/configuracion` - Configuración del Tenant

**Propósito:** Gestión de organización y preferencias.

| Sub-página | Descripción | Servicio Supabase | Objetivo |
|------------|-------------|-------------------|----------|
| `/perfil` | Editar nombre, foto del usuario | **Data API** + **Storage** | - |
| `/organizacion` | Nombre empresa, logo, plan | **Data API** + **Storage** | - |
| Hub principal | QuotaIndicator, toggle tema | **Data API** | - |

#### Flujo de Datos: Realtime para Dashboard (Broadcast Recomendado)

**⚠️ IMPORTANTE:** Para alta escala (>100 usuarios), usar **Broadcast** en lugar de Postgres Changes.

**Postgres Changes (Para <100 usuarios):**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useIncidentRealtime(projectId: string) {
  const [incidents, setIncidents] = useState([])
  
  useEffect(() => {
    const channel = supabase
      .channel(`incidents:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'incidents',
          filter: `project_id=eq.${projectId}` // Filtro server-side
        },
        (payload) => {
          console.log('Incident changed:', payload)
          // Refrescar lista de incidencias
          fetchIncidents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])
  
  return incidents
}
```

**Broadcast (Recomendado para escala):**

```typescript
// Client-side
const channel = supabase
  .channel(`incidents:${projectId}`, {
    config: { private: true } // Requiere Realtime Authorization
  })
  .on('broadcast', { event: 'incident_created' }, (payload) => {
    console.log('New incident:', payload)
    setIncidents(prev => [payload.new, ...prev])
  })
  .on('broadcast', { event: 'incident_updated' }, (payload) => {
    console.log('Updated incident:', payload)
    setIncidents(prev => prev.map(i => 
      i.id === payload.new.id ? payload.new : i
    ))
  })
  .subscribe()
```

**Ventajas de Broadcast vs Postgres Changes:**
- ✅ Mejor performance a escala (no evalúa RLS por subscriber)
- ✅ Más flexible (custom payloads)
- ✅ Menor carga en database
- ⚠️ Requiere trigger en database para emitir eventos

#### Flujo de Datos: Consulta de Incidencias con Filtros

**⚡ Performance: Patrón RLS Optimizado (Schema v3.2)**

Las RLS policies usan `(select auth.uid())` en lugar de `auth.uid()` directo para cachear el resultado:

```sql
-- Política aplicada en schema v3.2
CREATE POLICY "Users can view organization incidents"
ON incidents FOR SELECT
TO authenticated
USING ((select auth.jwt() ->> 'current_org_id')::uuid = organization_id);
```

Esto resulta en **99.94% de mejora de performance** según benchmarks de Supabase.

**Implementación Client-Side (TypeScript):**

```typescript
// Dashboard - Consultar incidencias con filtros avanzados
const { data: incidents, error } = await supabase
  .from('incidents')
  .select(`
    id,
    type,
    title,
    description,
    priority,
    status,
    created_at,
    created_by:users!incidents_created_by_fkey(
      id,
      full_name,
      email
    ),
    assigned_to:users!incidents_assigned_to_fkey(
      id,
      full_name
    ),
    project:projects(
      id,
      name,
      location
    ),
    photos(id, storage_path)
  `)
  .eq('project_id', selectedProjectId) // Filtro explícito
  .in('status', ['OPEN', 'ASSIGNED'])  // Excluir cerradas
  .order('priority', { ascending: false })
  .order('created_at', { ascending: false })
  .limit(50) // Paginación

if (error) {
  console.error('Error fetching incidents:', error)
} else {
  console.log('Incidents:', incidents)
}
```

**🎯 Best Practices:**
- ✅ Especificar campos exactos (evitar `select('*')`)
- ✅ Usar foreign key names para joins (ej: `users!incidents_created_by_fkey`)
- ✅ Agregar filtros explícitos aunque RLS filtre automáticamente
- ✅ Limitar resultados con `.limit()` para paginación
- ✅ Ordenar por múltiples campos para sorting consistente

1. **Consultar límites de organización**: Obtener de tabla `organizations` los campos `storage_used_mb`, `storage_limit_mb`, `max_users`, `max_projects` filtrando estrictamente por `id` del tenant.
2. **Contar usuarios activos**: Consultar tabla `users` contando registros donde `organization_id` coincide y `deleted_at` es NULL.
3. **Contar proyectos activos**: Consultar tabla `projects` contando registros donde `organization_id` coincide y `status` es estrictamente igual a 'ACTIVE'.
4. **Calcular porcentajes**: Mostrar barras de progreso comparando uso actual vs. límites.

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Flujo de Auth con SSR (Next.js/Framework SSR)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Login Form  │────▶│ Supabase    │────▶│ JWT Hook    │
│ (email/pwd) │     │ Auth        │     │ (claims)    │
└─────────────┴─────┴─────────────┴─────────────┘
          │                           │
          ▼                           ▼
   ┌────────────────┐       ┌─────────────────┐
   │ Session JWT   │       │ Custom Claims  │
   │ + Cookies     │       │ - org_id       │
   │ (HTTPOnly)    │       │ - user_role    │
   └────────────────┘       └─────────────────┘
```

### SSR con Supabase Auth (Next.js)

**⚡ IMPORTANTE:** Para aplicaciones SSR, usar `@supabase/ssr` en lugar de `@supabase/supabase-js`.

**Implementación Server-Side (Next.js App Router):**

```typescript
// app/dashboard/page.tsx (Server Component)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Extraer custom claims del JWT
  const orgId = session.user.user_metadata?.current_org_id
  const orgRole = session.user.user_metadata?.current_org_role
  
  // Consultar datos en server-side
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1>Dashboard - {orgRole}</h1>
      {/* Renderizar incidents */}
    </div>
  )
}
```

**Ventajas de SSR con Supabase:**
- ✅ SEO optimizado (contenido renderizado en servidor)
- ✅ Performance mejorado (menos client-side JS)
- ✅ Seguridad (cookies HTTPOnly)
- ✅ RLS aplicado en server-side

### Custom Access Token Hook (Schema v3.2)

El schema incluye un hook que inyecta automáticamente contexto organizacional:

```sql
-- Ya implementado en schema v3.2
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  current_org_id uuid;
  current_org_role public.user_role;
BEGIN
  -- Extraer organización y rol del usuario
  SELECT u.current_organization_id, om.role
  INTO current_org_id, current_org_role
  FROM public.users u
  LEFT JOIN public.organization_members om 
    ON om.user_id = u.id 
    AND om.organization_id = u.current_organization_id
  WHERE u.id = (event->>'user_id')::uuid;

  -- Inyectar en JWT
  claims := event->'claims';
  IF current_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{current_org_id}', to_jsonb(current_org_id));
    claims := jsonb_set(claims, '{current_org_role}', to_jsonb(current_org_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE;
```

**Beneficios:**
- ✅ No necesitas queries adicionales para obtener `org_id` y `role`
- ✅ RLS policies pueden usar `auth.jwt() ->> 'current_org_id'`
- ✅ Contexto siempre disponible en cada request
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────┐
│              JWT con Custom Claims                   │
│  {                                                  │
│    "sub": "auth-user-id",                          │
│    "role": "authenticated",                         │
│    "user_role": "OWNER",        ← Rol de negocio   │
│    "org_id": "org-uuid",        ← Tenant ID        │
│    "user_id": "user-uuid"       ← ID en public.users│
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

**¿Por qué Custom Access Token Hook?**
> Cumple los 3 objetivos: El JWT incluye `org_id` y `user_role` para que **cada query** filtre automáticamente por organización y valide permisos sin JOINs adicionales. Esto mejora performance y seguridad.

### Flujo de Datos: Autenticación SSR

1. **Crear cliente Supabase en servidor**: Inicializar cliente con credenciales de entorno y manejo de cookies.
2. **Gestión de cookies**:
   - `get`: Leer cookie de sesión del request
   - `set`: Escribir cookie actualizada en response
   - `remove`: Eliminar cookie al logout
3. **Middleware de protección**: Antes de renderizar rutas protegidas:
   - Obtener usuario actual de la sesión
   - Si no hay usuario o hay error, redirigir a `/login`
   - Si hay usuario válido, continuar renderizado

---

## 📊 SERVICIOS SUPABASE - USO EN WEB

### 1. Database (PostgreSQL)

| Uso en Web | Descripción | Tablas Involucradas |
|------------|-------------|---------------------|
| Lectura de datos | Todas las consultas SELECT | Todas |
| Escritura de datos | INSERT/UPDATE desde formularios | projects, project_members, invitations, bitacora_entries |
| Views optimizadas | Consultas complejas pre-calculadas | bitacora_timeline |
| Funciones RPC | Operaciones complejas | soft_delete_user() |

### 2. Authentication

| Uso en Web | Descripción |
|------------|-------------|
| Email/Password Login | Único método MVP |
| Session Management | Cookies HTTPOnly (SSR) |
| Custom Claims | org_id, user_role, user_id en JWT |
| Protected Routes | Middleware de servidor |

### 3. Storage

| Bucket | Uso en Web | Acceso |
|--------|------------|--------|
| `incident-photos` | Visualizar fotos de incidencias | URLs firmadas (privado) |
| `org-assets` | Logos de organización | Público |

### 4. Realtime

| Canal | Evento | Uso en Web |
|-------|--------|------------|
| `incidents-dashboard` | INSERT, UPDATE | Actualizar KPIs y Activity Feed |
| `project-{id}-incidents` | INSERT | Notificar nuevas incidencias en proyecto |
| `comments-{incident_id}` | INSERT | Actualizar hilo de comentarios |

### 5. Data API (PostgREST)

| Tipo de Query | Uso |
|---------------|-----|
| SELECT con filtros | Listas paginadas |
| SELECT con count | KPIs |
| INSERT | Crear proyectos, entradas bitácora |
| UPDATE | Editar proyectos, asignar usuarios |
| RPC | soft_delete_user, funciones complejas |

### 6. Edge Functions

| Función | Propósito | Trigger |
|---------|-----------|----------|
| `send-invitation-email` | Enviar emails de invitación a nuevos usuarios | INSERT en tabla `invitations` |
| `push-notification` | Enviar notificaciones push a dispositivos móviles | INSERT/UPDATE en tabla `incidents` |

---

## 🔄 MATRIZ DE PERMISOS WEB

| Acción | OWNER | SUPERINTENDENT | RESIDENT | CABO |
|--------|:-----:|:--------------:|:--------:|:----:|
| Ver Dashboard | ✅ | ✅ | ❌ | ❌ |
| Crear proyecto | ✅ | ❌ | ❌ | ❌ |
| Editar proyecto | ✅ | ✅ | ❌ | ❌ |
| Asignar miembros | ✅ | ✅ | ❌ | ❌ |
| Ver Bitácora | ✅ | ✅ | ✅ | ✅ |
| Generar BESOP | ✅ | ✅ | ❌ | ❌ |
| Cerrar día | ✅ | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Ver configuración | ✅ | ❌ | ❌ | ❌ |

---

## 🔐 RLS POLICIES - SEGURIDAD MULTI-TENANT

### Principio Fundamental

Todas las tablas tienen RLS habilitado. Las políticas usan `(SELECT func())` para caching de JWT claims (95-99% más rápido que llamar funciones directamente).

### Políticas por Tabla

#### `organizations` (2 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| Users view own organization | SELECT | `id = org_id del JWT` | authenticated |
| Owner updates organization | UPDATE | `id = org_id del JWT AND user_role = 'OWNER'` | authenticated |

#### `invitations` (3 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org invitations | SELECT | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |
| Owner creates invitations | INSERT | `org_id coincide AND user_role = 'OWNER'` | authenticated |
| Owner deletes invitations | DELETE | `org_id coincide AND user_role = 'OWNER' AND accepted_at IS NULL` | authenticated |

#### `users` (4 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org users | SELECT | `org_id coincide AND deleted_at IS NULL` | authenticated |
| Owner creates users | INSERT | `org_id coincide AND user_role = 'OWNER'` | authenticated |
| Update own profile | UPDATE | `auth_id = auth.uid() AND deleted_at IS NULL` | authenticated |
| Owner updates users | UPDATE | `org_id coincide AND user_role = 'OWNER' AND deleted_at IS NULL` | authenticated |

#### `projects` (3 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org projects | SELECT | `org_id coincide` | authenticated |
| Owner creates projects | INSERT | `org_id coincide AND user_role = 'OWNER'` | authenticated |
| Owner/Super updates projects | UPDATE | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |

#### `project_members` (3 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org project members | SELECT | `org_id coincide` | authenticated |
| Owner/Super assigns members | INSERT | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |
| Owner/Super removes members | DELETE | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |

#### `incidents` (4 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org incidents | SELECT | `org_id coincide` | authenticated |
| Any role creates incidents | INSERT | `org_id coincide` | authenticated |
| Authorized roles update incidents | UPDATE | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT', 'RESIDENT')` | authenticated |
| Creator updates own incident | UPDATE | `org_id coincide AND created_by = user_id AND status != 'CLOSED'` | authenticated |

#### `photos` (3 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org photos | SELECT | `org_id coincide` | authenticated |
| Upload photos | INSERT | `org_id coincide` | authenticated |
| Delete own photos | DELETE | `org_id coincide AND (uploaded_by = user_id OR user_role = 'OWNER')` | authenticated |

#### `comments` (2 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org comments | SELECT | `org_id coincide` | authenticated |
| Add comments | INSERT | `org_id coincide` | authenticated |

#### `bitacora_entries` (2 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org bitacora entries | SELECT | `org_id coincide` | authenticated |
| Owner/Super creates entries | INSERT | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |

#### `bitacora_day_closures` (2 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| View org day closures | SELECT | `org_id coincide` | authenticated |
| Owner/Super closes days | INSERT | `org_id coincide AND user_role IN ('OWNER', 'SUPERINTENDENT')` | authenticated |

#### `audit_logs` (2 políticas)

| Política | Operación | Condición | Roles |
|----------|-----------|-----------|-------|
| Owner views audit logs | SELECT | `org_id coincide AND user_role = 'OWNER'` | authenticated |
| System inserts audit logs | INSERT | `TRUE` (via triggers) | system |

---

## 🔑 CUSTOM ACCESS TOKEN HOOK

### Función `custom_access_token_hook`

Esta función inyecta custom claims en el JWT al momento del login:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
    claims JSONB;
    user_role TEXT;
    org_id UUID;
    user_id_local UUID;
BEGIN
    -- Fetch role, organization_id, and user_id ONCE
    SELECT role::TEXT, organization_id, id
    INTO user_role, org_id, user_id_local
    FROM public.users 
    WHERE auth_id = (event->>'user_id')::UUID;

    claims := event->'claims';

    -- Add to JWT to avoid JOINs in every query
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    END IF;
    
    IF org_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{org_id}', to_jsonb(org_id::TEXT));
    END IF;
    
    IF user_id_local IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_id}', to_jsonb(user_id_local::TEXT));
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Permisos del Hook

```sql
-- Grant execute del hook al rol de auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON TABLE public.users TO supabase_auth_admin;

-- Revocar acceso desde roles públicos
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Política RLS para que auth_admin pueda leer users
CREATE POLICY "Allow auth admin to read users for JWT hook"
    ON public.users FOR SELECT TO supabase_auth_admin USING (true);
```

### Configuración en Supabase Dashboard

1. Ir a **Authentication** → **Hooks**
2. En **Custom Access Token Hook**, seleccionar la función `custom_access_token_hook`
3. Guardar cambios

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Core (Semana 1-2)

- [ ] Setup framework web + Supabase SSR
- [ ] Auth: Login/Logout con cookies
- [ ] Layout con Sidebar
- [ ] Dashboard básico (KPIs estáticos)

### Fase 2: Proyectos (Semana 3)

- [ ] CRUD Proyectos
- [ ] Vista detalle con tabs
- [ ] Gestión de miembros

### Fase 3: Realtime (Semana 4)

- [ ] Suscripción a incidents
- [ ] Activity Feed en vivo
- [ ] Notificaciones de críticos

### Fase 4: Bitácora (Semana 5)

- [ ] Timeline con bitacora_timeline VIEW
- [ ] Filtros por fuente
- [ ] OfficialComposer básico
- [ ] Cierre de día

### Fase 5: Usuarios + Config (Semana 6)

- [ ] Lista de usuarios
- [ ] Sistema de invitaciones
- [ ] Soft delete
- [ ] QuotaIndicator
- [ ] Perfil y organización

---

## 📚 REFERENCIAS

- Ver `STROP_MOBILE_APP.md` para especificación de la app móvil
- Ver `STROP_INTEGRATION.md` para integración web-app
- Ver `supabase-strop-schema.sql` para schema de base de datos
- Ver `REQUIREMENTS_MVP.md` para requerimientos de negocio
