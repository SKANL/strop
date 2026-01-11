# 🔄 STROP INTEGRATION - Web + Mobile

> **Versión:** 1.1 MVP (Stack Agnóstico)
> **Última actualización:** Enero 10, 2026
> **Audiencia:** Product Managers, Arquitectos de Sistemas, Desarrolladores
> **Complementos:** `STROP_WEB_PLATFORM.md` y `STROP_MOBILE_APP.md`

---

## 📋 RESUMEN EJECUTIVO

Este documento define cómo la plataforma web y la aplicación móvil de STROP trabajan juntas como un sistema cohesivo. Ambas interfaces comparten el mismo backend Supabase pero sirven a usuarios con roles y necesidades diferentes.

### Arquitectura Multi-Tenant

STROP implementa aislamiento estricto por organización. Cada tabla incluye `organization_id` para RLS (Row Level Security).

```
organizations (tenant raíz)
├── users ─────────────────────── Usuarios de la org
├── invitations ───────────────── Invitaciones pendientes  
├── projects ──────────────────── Obras de construcción
│   ├── project_members ───────── Asignación usuario-proyecto
│   └── incidents ─────────────── Incidencias reportadas
│       ├── photos ────────────── Fotos adjuntas
│       └── comments ──────────── Comentarios/discusión
├── bitacora_entries ──────────── Entradas manuales de bitácora
├── bitacora_day_closures ─────── Cierres diarios inmutables
└── audit_logs ────────────────── Registro de auditoría
```

### Filosofía de Integración

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ECOSISTEMA STROP                              │
│                                                                       │
│  ┌─────────────────┐                      ┌─────────────────┐        │
│  │   MOBILE APP    │                      │   WEB PLATFORM  │        │
│  │  (Generador)    │                      │   (Consumidor)  │        │
│  │                 │                      │                 │        │
│  │  👷 Campo       │    ════════════▶    │  📊 Oficina     │        │
│  │  RESIDENT/CABO  │      DATOS          │  D/A            │        │
│  │                 │                      │                 │        │
│  │  • Crear        │                      │  • Visualizar   │        │
│  │  • Fotografiar  │                      │  • Analizar     │        │
│  │  • Reportar     │                      │  • Decidir      │        │
│  └────────┬────────┘                      └────────┬────────┘        │
│           │                                        │                  │
│           │         ┌─────────────────┐           │                  │
│           └────────▶│    SUPABASE     │◀──────────┘                  │
│                     │    BACKEND      │                              │
│                     │                 │                              │
│                     │  • Database     │                              │
│                     │  • Auth         │                              │
│                     │  • Storage      │                              │
│                     │  • Realtime     │                              │
│                     │  • Edge Funcs   │                              │
│                     └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 TABLAS COMPARTIDAS - OPERACIONES POR PLATAFORMA

| Tabla | Web (D/A) | Mobile (Campo) | Notas |
|-------|-----------|----------------|-------|
| `organizations` | READ, UPDATE (config) | READ | Solo OWNER puede modificar |
| `users` | CRUD completo | READ (mi perfil), UPDATE (foto/tema) | Web gestiona usuarios, Mobile solo lee |
| `invitations` | CREATE, READ, DELETE | - | Solo Web envía invitaciones |
| `projects` | CRUD completo | READ | Web gestiona proyectos |
| `project_members` | CREATE, READ, DELETE | READ | Web asigna miembros |
| `incidents` | READ, UPDATE (asignar) | CREATE, READ, UPDATE (cerrar) | **Flujo bidireccional principal** |
| `photos` | READ | CREATE, READ | Mobile sube, Web visualiza |
| `comments` | CREATE, READ | CREATE, READ | **Comunicación bidireccional** |
| `bitacora_entries` | CREATE, READ, UPDATE | - | Solo Web genera bitácora |
| `bitacora_day_closures` | CREATE, READ | - | Solo Web cierra días |
| `audit_logs` | READ | - | Automático via triggers |

---

## 🎯 FLUJO DE DATOS POR OBJETIVO DE NEGOCIO

### Objetivo 1: Agilizar la captura de información en campo

**Flujo: Mobile → Database → Web**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MOBILE (Campo)              SUPABASE               WEB (Oficina)       │
│                                                                          │
│  ┌─────────────────┐   INSERT   ┌─────────────┐                         │
│  │ Crear Incidencia│──────────▶│ incidents   │                         │
│  └─────────────────┘           │ table       │                         │
│                                └──────┬──────┘                         │
│  ┌─────────────────┐   UPLOAD          │                                │
│  │ Subir Fotos     │──────────▶│ Storage    │         ▼                │
│  └─────────────────┘           └──────┬──────┘  ┌─────────────────┐    │
│                                       │         │ Dashboard ve    │    │
│                                       │ REALTIME│ nueva incidencia│    │
│                                       └────────▶│ en tiempo real  │    │
│                                                 └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Servicios Supabase Involucrados:**

| Servicio | Rol en Mobile | Rol en Web | Objetivo |
|----------|---------------|------------|----------|
| **Data API** | INSERT incidencia | SELECT para dashboard | Obj 1 |
| **Storage** | Upload fotos (resumable) | GET signed URLs para galería | Obj 1 |
| **Realtime** | - | Suscripción a INSERT incidents | Obj 1 |

#### Flujo de Datos: Suscripción Web a Nuevas Incidencias

1. **Al montar componente de dashboard**: Establecer suscripción al canal de cambios de PostgreSQL.
2. **Configurar filtro**: Escuchar eventos INSERT en tabla `incidents` donde `project_id` es igual al proyecto seleccionado.
3. **Al recibir evento** (incidencia creada desde Mobile):
   - Agregar el nuevo registro al estado local (actualización optimista).
   - Mostrar notificación toast con preview de la descripción.
4. **Cleanup**: Al desmontar componente, remover la suscripción.

#### Flujo de Datos: Mobile Crea Incidencia

1. **Insertar en tabla `incidents`**: Esto dispara automáticamente evento Realtime hacia Web.
2. **Upload de fotos a Storage**: Para cada foto, subir binario al bucket `incident-photos`.
3. **Registrar fotos en DB**: Insertar registros en tabla `photos` vinculando con la incidencia.
4. **Resultado**: La Web ya recibió el evento Realtime y muestra la incidencia.

---

### Objetivo 2: Centralizar y organizar el flujo de incidencias

**Flujo: Web ↔ Database ↔ Mobile**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WEB (Oficina)               SUPABASE               MOBILE (Campo)       │
│                                                                          │
│  ┌─────────────────┐   UPDATE   ┌─────────────┐                         │
│  │ Asignar         │──────────▶│ incidents   │──────────▶ Push Notif   │
│  │ Incidencia      │           │ assigned_to │           a RESIDENT    │
│  └─────────────────┘           └──────┬──────┘                         │
│                                       │                                 │
│  ┌─────────────────┐   SELECT         │         ┌─────────────────┐    │
│  │ Filtrar por     │◀──────────│             │ │ Ver mis         │    │
│  │ Estado/Tipo     │           │ Database    │◀│ asignaciones    │    │
│  └─────────────────┘           │ (mismos     │ └─────────────────┘    │
│                                │ datos)      │                         │
│  ┌─────────────────┐   SELECT  │             │ ┌─────────────────┐    │
│  │ Ver KPIs y      │◀──────────│             │ │ Actualizar      │    │
│  │ estadísticas    │           │             │──│ estado          │    │
│  └─────────────────┘           └─────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Servicios Supabase Involucrados:**

| Servicio | Rol en Web | Rol en Mobile | Objetivo |
|----------|------------|---------------|----------|
| **Database** | ENUM types para clasificación | Mismos ENUMs | Obj 2 |
| **Data API** | Queries con filtros avanzados | Queries para mis asignaciones | Obj 2 |
| **Realtime** | Suscripción a cambios de estado | Suscripción a asignaciones | Obj 2 |
| **Edge Functions** | - | Push cuando asignan | Obj 2 |

#### Consistencia de Datos entre Plataformas

Los tipos ENUM de PostgreSQL aseguran consistencia estricta entre Web y Mobile:

| ENUM | Valores Válidos | Uso |
|------|------------------|-----|
| `subscription_plan` | 'STARTER', 'PROFESSIONAL', 'ENTERPRISE' | Planes de suscripción |
| `user_role` | 'OWNER', 'SUPERINTENDENT', 'RESIDENT', 'CABO' | Roles de negocio en JWT |
| `project_status` | 'ACTIVE', 'PAUSED', 'COMPLETED' | Estado de obras |
| `project_role` | 'SUPERINTENDENT', 'RESIDENT', 'CABO' | Rol específico por proyecto |
| `incident_type` | 'ORDER_INSTRUCTION', 'REQUEST_QUERY', 'CERTIFICATION', 'INCIDENT_NOTIFICATION' | Clasificación de incidencias |
| `incident_priority` | 'NORMAL', 'CRITICAL' | Prioridad de incidencias |
| `incident_status` | 'OPEN', 'ASSIGNED', 'CLOSED' | Flujo de estados |
| `event_source` | 'ALL', 'INCIDENT', 'MANUAL', 'MOBILE', 'SYSTEM' | Origen de eventos bitácora |

> **Importante:** Ambas plataformas usan exactamente los mismos valores. PostgreSQL rechaza cualquier valor no válido a nivel de base de datos.

#### Flujo de Datos: Asignar desde Web, Notificar a Mobile

**Lado Web (Asignación):**

1. Ejecutar UPDATE en tabla `incidents` estableciendo:
   - `assigned_to`: ID del usuario asignado
   - `status`: 'ASSIGNED'
2. Este UPDATE dispara:
   - Broadcast Realtime hacia Mobile (si app está abierta)

**Lado Mobile (Recepción):**

1. **Opción A - Realtime (app abierta)**:
   - Suscripción escucha eventos UPDATE en `incidents`.
   - Filtro estricto: `assigned_to` es igual al ID del usuario actual.
   - Al recibir evento donde `assigned_to` anterior era distinto:
     - Mostrar notificación local "Te asignaron una incidencia".
     - Refrescar lista de incidencias asignadas.
2. **Opción B - App cerrada**:
   - El usuario verá los cambios al volver a abrir la app.
   - La lista de incidencias asignadas se actualiza automáticamente al consultar.

---

### Objetivo 3: Acelerar la toma de decisiones

**Flujo: Comunicación Bidireccional en Tiempo Real**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WEB (D/A en Oficina)        SUPABASE          MOBILE (RESIDENT Campo)  │
│                                                                          │
│  ┌─────────────────┐                          ┌─────────────────┐       │
│  │ Comentar:       │   INSERT   ┌─────────┐   │ Recibe          │       │
│  │ "Verificar      │──────────▶│ comments │──▶│ comentario      │       │
│  │  tubería 3B"    │           │          │   │ en tiempo real  │       │
│  └─────────────────┘           └─────────┘   └─────────────────┘       │
│                                     │                                   │
│  ┌─────────────────┐                │        ┌─────────────────┐       │
│  │ Recibe          │                │        │ Responder:      │       │
│  │ respuesta       │◀───────────────┘◀───────│ "Verificado,    │       │
│  │ en tiempo real  │           INSERT        │  todo OK"       │       │
│  └─────────────────┘                         └─────────────────┘       │
│                                                                          │
│  ┌─────────────────┐           ┌─────────┐   ┌─────────────────┐       │
│  │ Ve incidencia   │◀──────────│incidents│◀──│ Cerrar          │       │
│  │ cerrada en      │   UPDATE  │ status  │   │ incidencia      │       │
│  │ dashboard       │           └─────────┘   └─────────────────┘       │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Servicios Supabase Involucrados:**

| Servicio | Propósito | Web | Mobile |
|----------|-----------|-----|--------|
| **Realtime** | Comentarios en vivo | Suscripción a INSERT comments | Suscripción a INSERT comments |
| **Realtime** | Estado de incidencias | Suscripción a UPDATE status | - |
| **Edge Functions** | Push para comments | Trigger en INSERT comment | Recibir push |
| **Data API** | Historial de comentarios | SELECT con pagination | SELECT con pagination |

#### Flujo de Datos: Thread de Comentarios Compartido (Web)

1. **Cargar comentarios existentes**: SELECT de tabla `comments` filtrando por `incident_id`.
2. **Establecer suscripción Realtime**: Escuchar eventos INSERT en `comments` con filtro estricto `incident_id=eq.{id}`.
3. **Al recibir nuevo comentario** (puede venir de Mobile):
   - Consultar tabla `users` para obtener `name` y `role` del autor.
   - Agregar comentario enriquecido al estado local.
4. **Agregar comentario**: INSERT en tabla `comments` con `incident_id` y `content`. El `author_id` se establece via trigger/RLS.
5. **Resultado**: El INSERT dispara Realtime hacia Mobile.

#### Flujo de Datos: Thread de Comentarios Compartido (Mobile)

1. **Establecer suscripción Realtime**: Crear canal específico para la incidencia con filtro `incident_id=eq.{id}`.
2. **Al recibir nuevo comentario** (puede venir de Web):
   - Parsear comentario del payload.
   - Si el autor es diferente al usuario actual, mostrar notificación local "Nuevo comentario del D/A".
   - Agregar al estado local de comentarios.
3. **Agregar comentario**: INSERT en tabla `comments`. Esto dispara Realtime hacia Web.
4. **Cleanup al cerrar pantalla**: Cancelar suscripción del canal.

---

## 🔐 AUTENTICACIÓN COMPARTIDA

### Mismo Sistema de Auth para Ambas Plataformas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE AUTH                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Custom Access Token Hook                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐│    │
│  │  │ {                                                           ││    │
│  │  │   "sub": "auth-user-id",                                    ││    │
│  │  │   "role": "authenticated",                                  ││    │
│  │  │   "user_role": "RESIDENT",  ← Rol de negocio                ││    │
│  │  │   "org_id": "org-uuid",     ← Tenant ID                     ││    │
│  │  │   "user_id": "user-uuid"    ← ID en public.users            ││    │
│  │  │ }                                                           ││    │
│  │  └─────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│              ┌────────────────┴────────────────┐                        │
│              │                                 │                        │
│              ▼                                 ▼                        │
│  ┌─────────────────┐                ┌─────────────────┐                │
│  │   WEB CLIENT    │                │  MOBILE CLIENT  │                │
│  │                 │                │                 │                │
│  │  Mismo JWT      │                │  Mismo JWT      │                │
│  │  Mismos claims  │                │  Mismos claims  │                │
│  │  Misma sesión   │                │  Misma sesión   │                │
│  └─────────────────┘                └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

**¿Por qué Custom Claims?**
> Las custom claims en el JWT permiten que tanto Web como Mobile accedan a `org_id` y `user_role` sin hacer queries adicionales a la base de datos. Esto habilita RLS eficiente y decisiones de UI basadas en rol.

### Sesión Compartida (Opcional)

Un usuario podría tener sesión activa en **ambas plataformas** simultáneamente:

| Escenario | Comportamiento |
|-----------|----------------|
| Login en Web | Crea sesión. Mobile no afectado. |
| Login en Mobile | Crea sesión. Web no afectado. |
| Logout en Web | Solo cierra sesión Web. Mobile sigue activo. |
| Password Change | Invalida TODAS las sesiones (Web + Mobile) |
| Desactivar usuario | RLS bloquea acceso en ambas plataformas |

---

## 📦 STORAGE COMPARTIDO

### Estructura de Buckets

| Bucket | Visibilidad | Tamaño Máximo | Tipos MIME | Propósito |
|--------|-------------|---------------|------------|-----------|
| `incident-photos` | Privado (RLS) | 5MB | image/jpeg, image/png, image/webp | Fotos de incidencias |
| `org-assets` | Público | 2MB | image/* | Logos, avatares |

```
storage/
├── incident-photos/                 ← Privado (RLS)
│   └── {org_id}/
│       └── {project_id}/
│           └── {incident_id}/
│               └── {uuid}.jpg       ← Mobile sube, Web consume
│
└── org-assets/                      ← Público (logos, avatares)
    └── {org_id}/
        ├── logo.png                 ← Web sube, Mobile consume
        └── users/
            └── {user_id}/
                └── avatar.jpg       ← Cualquiera sube
```

### Storage Policies Detalladas

#### Bucket: `incident-photos` (Privado)

| Operación | Política | Condición SQL | Web | Mobile |
|-----------|----------|---------------|-----|--------|
| SELECT | View org photos | `bucket_id = 'incident-photos' AND (storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ✅ |
| INSERT | Upload org photos | `bucket_id = 'incident-photos' AND (storage.foldername(name))[1] = get_user_org_id()::text` | ❌ | ✅ |
| DELETE | - | Prohibido (evidencia) | - | - |

**Validación de Path:**

```
Path esperado: {org_id}/{project_id}/{incident_id}/{uuid}.jpg
Ejemplo: "abc123-org/proj456/inc789/foto-uuid.jpg"
```

#### Bucket: `org-assets` (Público)

| Operación | Política | Condición SQL | Web | Mobile |
|-----------|----------|---------------|-----|--------|
| SELECT | Público | `bucket_id = 'org-assets'` | ✅ | ✅ |
| INSERT | Upload own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ✅ |
| UPDATE | Update own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ✅ |
| DELETE | Delete own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ❌ |

### Flujo de Fotos: Mobile → Storage → Web

#### Flujo de Datos: Web Muestra Galería de Fotos

1. **Consultar paths de fotos**: Obtener `storage_path` y `created_at` de tabla `photos` filtrando estrictamente por `incident_id`. Ordenar por fecha de creación.
2. **Generar URLs firmadas**: Para cada path, solicitar a Supabase Storage una URL firmada con expiración de 3600 segundos (1 hora).
3. **Filtrar URLs válidas**: Remover cualquier URL nula del resultado.
4. **Renderizar galería**: Mostrar imágenes usando las URLs firmadas temporales.

#### Flujo de Datos: Mobile Sube Foto

1. **Comprimir imagen**: Reducir calidad a 80% y dimensiones máximas a 1920x1920px.
2. **Generar path único**: Estructura: `{org_id}/{project_id}/{incident_id}/{uuid}.jpg`
3. **Upload resumable**: Subir binario comprimido al bucket `incident-photos` con tipo MIME `image/jpeg`.
4. **Retornar path**: El path se usa para registrar la foto en base de datos.

---

## 📡 CANALES REALTIME COMPARTIDOS

### Arquitectura de Canales

| Canal | Evento | Suscriptores | Propósito |
|-------|--------|--------------|-----------|
| `project:{id}:incidents` | INSERT | Web (dashboard), Mobile (opcional) | Nuevas incidencias |
| `project:{id}:incidents` | UPDATE | Web (dashboard), Mobile (lista) | Cambios de estado/asignación |
| `incident:{id}:comments` | INSERT | Web (detalle), Mobile (detalle) | Thread de comentarios |
| `user:{id}:assignments` | UPDATE incidents | Mobile | Notificar nuevas asignaciones |

### Diagrama de Suscripciones

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      REALTIME CHANNELS                                   │
│                                                                          │
│  project:abc123:incidents                                               │
│  ├── Web Dashboard (suscrito a INSERT + UPDATE)                         │
│  └── Mobile Lista (suscrito a UPDATE assigned_to=me)                    │
│                                                                          │
│  incident:xyz789:comments                                               │
│  ├── Web Detalle (suscrito a INSERT)                                    │
│  └── Mobile Detalle (suscrito a INSERT)                                 │
│                                                                          │
│  user:u123:notifications                                                │
│  └── Mobile (suscrito a INSERT para push local)                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Especificación de Canal Compartido para Incidencias:**

#### Flujo de Datos: Creación de Canal de Incidencias por Proyecto

1. **Nombre del canal**: `project-{projectId}-incidents`
2. **Tabla observada**: `incidents`
3. **Schema**: `public`
4. **Filtro estricto**: `project_id=eq.{projectId}`
5. **Eventos suscritos**:
   - `INSERT`: Ejecutar callback `onInsert` con el nuevo registro como parámetro.
   - `UPDATE`: Ejecutar callback `onUpdate` con registro nuevo y registro anterior como parámetros.
6. **Resultado**: Cualquier INSERT o UPDATE en `incidents` donde `project_id` coincida dispara el callback correspondiente hacia todos los clientes suscritos (Web y Mobile).

---

## 🔄 SINCRONIZACIÓN DE ESTADOS

### Máquina de Estados de Incidencias

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    │  MOBILE (Campo)           WEB (Oficina)         │
                    │                                                 │
                    │  ┌────────┐                                     │
                    │  │ CREAR  │─────────────▶ OPEN                  │
                    │  └────────┘                 │                   │
                    │                             │                   │
                    │                    ┌────────┴────────┐          │
                    │                    │ ASIGNAR (Web)   │          │
                    │                    └────────┬────────┘          │
                    │                             │                   │
                    │                             ▼                   │
                    │  ◀─ Realtime ──────── ASSIGNED                  │
                    │                             │                   │
                    │  ┌────────────────────────┬─┴─┬────────────┐   │
                    │  │                        │   │            │   │
                    │  ▼                        ▼   ▼            ▼   │
                    │  MOBILE: Trabajar    MOBILE:Cerrar    Web:    │
                    │  en incidencia       incidencia       Comentar │
                    │                          │                     │
                    │                          ▼                     │
                    │  ◀─ Realtime ──────── CLOSED                   │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
```

### Transiciones de Estado por Plataforma

| Estado Actual | Acción | Nuevo Estado | Quién lo hace | Dónde |
|---------------|--------|--------------|---------------|-------|
| - | Crear | OPEN | RESIDENT/CABO | Mobile |
| OPEN | Asignar | ASSIGNED | D/A (OWNER/SUPERINTENDENT) | Web |
| ASSIGNED | Cerrar | CLOSED | RESIDENT+ | Mobile |
| OPEN | Cerrar directo | CLOSED | D/A | Web |

### Triggers Automáticos Compartidos

Los siguientes triggers se ejecutan automáticamente y afectan datos visibles en ambas plataformas:

| Trigger | Tabla | Evento | Acción | Impacto |
|---------|-------|--------|--------|---------|
| `on_auth_user_created` | `auth.users` | INSERT | Crea registro en `public.users` vía invitación | Nuevo usuario disponible en ambas |
| `update_*_updated_at` | Todas | UPDATE | Actualiza campo `updated_at` | Timestamp consistente |
| `validate_photo_count` | `photos` | INSERT | Valida max 5 fotos por incidencia | Previene exceso desde Mobile |
| `audit_*_changes` | Críticas | INSERT/UPDATE/DELETE | Registra en `audit_logs` | Auditoría visible solo en Web |
| `lock_entries_on_closure` | `bitacora_day_closures` | INSERT | Marca `is_locked=true` en bitacora_entries del día | Inmutabilidad de bitácora |

### Índices Optimizados para Queries Comunes

| Índice | Tabla | Columnas | Query Optimizado |
|--------|-------|----------|------------------|
| `idx_incidents_org_project` | incidents | (organization_id, project_id) | Dashboard filtrado por proyecto |
| `idx_incidents_org_assigned` | incidents | (organization_id, assigned_to) | "Mis asignaciones" en Mobile |
| `idx_incidents_org_status` | incidents | (organization_id, status) | Filtro por estado |
| `idx_incidents_org_created` | incidents | (organization_id, created_by) | "Mis incidencias creadas" |
| `idx_photos_incident` | photos | (incident_id) | Galería de fotos |
| `idx_comments_incident_created` | comments | (incident_id, created_at) | Thread de comentarios ordenado |
| `idx_project_members_project` | project_members | (project_id) | Miembros por proyecto |
| `idx_project_members_user` | project_members | (user_id) | Proyectos del usuario |

---

## 📊 SERVICIOS SUPABASE - MATRIZ DE USO

| Servicio | Web (Oficina) | Mobile (Campo) | Integración |
|----------|---------------|----------------|-------------|
| **Database** | Queries analíticos, agregaciones, VIEW bitacora_timeline | CRUD simple, filtros básicos | Misma data, diferentes vistas |
| **Auth** | Login admin, invitaciones | Login campo, persistencia | Mismo JWT, custom claims |
| **Storage** | Ver fotos, logos | Subir fotos de incidencias | Mobile produce, Web consume |
| **Realtime** | Dashboard en vivo, comentarios | Notificaciones in-app, comentarios | Canales compartidos |
| **Data API** | PostgREST con includes complejos | PostgREST con filtros simples | Mismos endpoints |
| **Edge Functions** | Enviar emails invitación | - | DB Webhook → Email |

### VIEW Compartida: `bitacora_timeline`

La vista `bitacora_timeline` unifica eventos de diferentes fuentes para el timeline de bitácora (solo Web):

```sql
CREATE OR REPLACE VIEW bitacora_timeline AS
-- Incidencias como eventos
SELECT
  i.id,
  i.project_id,
  i.organization_id,
  'INCIDENT' AS event_type,
  i.type::TEXT AS subtype,
  i.description AS content,
  i.created_at AS event_date,
  i.created_by AS author_id,
  u.name AS author_name,
  i.id AS incident_id,
  NULL::UUID AS entry_id
FROM incidents i
JOIN users u ON i.created_by = u.id

UNION ALL

-- Comentarios como eventos
SELECT
  c.id,
  i.project_id,
  i.organization_id,
  'COMMENT' AS event_type,
  NULL AS subtype,
  c.content,
  c.created_at AS event_date,
  c.author_id,
  u.name AS author_name,
  c.incident_id,
  NULL::UUID AS entry_id
FROM comments c
JOIN incidents i ON c.incident_id = i.id
JOIN users u ON c.author_id = u.id

UNION ALL

-- Entradas manuales de bitácora
SELECT
  be.id,
  be.project_id,
  be.organization_id,
  'MANUAL' AS event_type,
  be.event_source::TEXT AS subtype,
  be.content,
  be.event_date,
  be.created_by AS author_id,
  u.name AS author_name,
  NULL::UUID AS incident_id,
  be.id AS entry_id
FROM bitacora_entries be
JOIN users u ON be.created_by = u.id;
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID del evento original |
| `project_id` | UUID | Proyecto asociado |
| `organization_id` | UUID | Organización (para RLS) |
| `event_type` | TEXT | 'INCIDENT', 'COMMENT', 'MANUAL' |
| `subtype` | TEXT | Tipo específico (incident_type o event_source) |
| `content` | TEXT | Contenido del evento |
| `event_date` | TIMESTAMPTZ | Fecha del evento |
| `author_id` | UUID | ID del autor |
| `author_name` | TEXT | Nombre del autor |
| `incident_id` | UUID | Incidencia relacionada (si aplica) |
| `entry_id` | UUID | Entrada de bitácora (si aplica) |

---

## 🔐 RLS - SEGURIDAD MULTI-TENANT COMPARTIDA

### Principio Fundamental de RLS Multi-Tenant

Ambas plataformas (Web y Mobile) utilizan las **mismas políticas RLS**. La diferencia radica en qué datos consultan, no en qué pueden ver. Todas las políticas usan funciones helper para extraer claims del JWT:

| Función RPC | Retorna | Uso |
|-------------|---------|-----|
| `get_user_org_id()` | UUID | Extrae `org_id` del JWT |
| `get_user_role()` | TEXT | Extrae `user_role` del JWT |
| `has_role_or_higher(required_role)` | BOOLEAN | Verifica jerarquía OWNER > SUPERINTENDENT > RESIDENT > CABO |

### RLS Policies Detalladas por Tabla

#### Tabla: `organizations`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View own org | `id = get_user_org_id()` | ✅ | ✅ |
| UPDATE | Owner updates org | `id = get_user_org_id() AND get_user_role() = 'OWNER'` | ✅ | ❌ |
| INSERT | - | Solo service_role | - | - |
| DELETE | - | Prohibido | - | - |

#### Tabla: `users`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org users | `organization_id = get_user_org_id()` | ✅ | ✅ |
| INSERT | Owner creates users | `organization_id = get_user_org_id() AND has_role_or_higher('OWNER')` | ✅ | ❌ |
| UPDATE | Self update profile | `id = get_user_id() AND organization_id = get_user_org_id()` | ✅ | ✅ |
| UPDATE | Owner updates any | `organization_id = get_user_org_id() AND has_role_or_higher('OWNER')` | ✅ | ❌ |
| DELETE | Owner soft deletes | `organization_id = get_user_org_id() AND has_role_or_higher('OWNER')` | ✅ | ❌ |

#### Tabla: `projects`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org projects | `organization_id = get_user_org_id()` | ✅ | ✅ |
| INSERT | Admin creates | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |
| UPDATE | Admin updates | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |
| DELETE | - | Prohibido | - | - |

#### Tabla: `project_members`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org assignments | `organization_id = get_user_org_id()` | ✅ | ✅ |
| INSERT | Admin assigns | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |
| DELETE | Admin removes | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |

#### Tabla: `incidents`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org incidents | `organization_id = get_user_org_id()` | ✅ | ✅ |
| INSERT | Any role creates | `organization_id = get_user_org_id()` | ✅ | ✅ |
| UPDATE | Authorized roles | `organization_id = get_user_org_id() AND has_role_or_higher('RESIDENT')` | ✅ | ✅ |
| UPDATE | Creator updates own | `organization_id = get_user_org_id() AND created_by = get_user_id() AND status != 'CLOSED'` | ✅ | ✅ |
| DELETE | - | Prohibido (auditoría) | - | - |

#### Tabla: `photos`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View via incident | `incident.organization_id = get_user_org_id()` (JOIN) | ✅ | ✅ |
| INSERT | Add to org incident | `incident.organization_id = get_user_org_id()` | ❌ | ✅ |
| DELETE | - | Prohibido (evidencia) | - | - |

#### Tabla: `comments`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View via incident | `incident.organization_id = get_user_org_id()` (JOIN) | ✅ | ✅ |
| INSERT | Add to org incident | `incident.organization_id = get_user_org_id()` | ✅ | ✅ |
| UPDATE | - | Prohibido (auditoría) | - | - |
| DELETE | - | Prohibido (auditoría) | - | - |

#### Tabla: `bitacora_entries`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org entries | `organization_id = get_user_org_id()` | ✅ | ❌ |
| INSERT | Admin creates | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |
| UPDATE | Admin updates | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT') AND NOT is_locked` | ✅ | ❌ |
| DELETE | - | Prohibido | - | - |

#### Tabla: `bitacora_day_closures`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org closures | `organization_id = get_user_org_id()` | ✅ | ❌ |
| INSERT | Admin closes day | `organization_id = get_user_org_id() AND has_role_or_higher('SUPERINTENDENT')` | ✅ | ❌ |
| UPDATE/DELETE | - | Prohibido (inmutable) | - | - |

#### Tabla: `audit_logs`

| Operación | Política | Condición | Web | Mobile |
|-----------|----------|-----------|-----|--------|
| SELECT | View org logs | `organization_id = get_user_org_id() AND has_role_or_higher('OWNER')` | ✅ | ❌ |
| INSERT/UPDATE/DELETE | - | Solo triggers internos | - | - |

### Custom Access Token Hook

El hook `custom_access_token_hook` inyecta claims personalizados en cada JWT:

```sql
-- Función en schema supabase_functions (protegido)
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_record public.users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM public.users WHERE auth_id = (event->>'user_id')::UUID;
  
  claims := event->'claims';
  
  IF user_record.id IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_record.role::TEXT));
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_record.organization_id::TEXT));
    claims := jsonb_set(claims, '{user_id}', to_jsonb(user_record.id::TEXT));
  END IF;
  
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

**Permisos requeridos:**

```sql
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;
```

### Verificación de Permisos en UI

#### Flujo de Datos: Verificar si Usuario Puede Asignar (Web)

1. **Obtener rol del usuario** desde el estado de sesión (extraído del JWT `user_role`).
2. **Verificar pertenencia**: El rol debe estar en la lista `['OWNER', 'SUPERINTENDENT', 'RESIDENT']`.
3. **Si cumple condición**: Mostrar botón de asignación.
4. **Si no cumple**: Ocultar o deshabilitar botón.

#### Flujo de Datos: Verificar si Usuario Puede Cerrar (Mobile)

1. **Obtener rol del usuario** desde el estado local de autenticación.
2. **Verificar pertenencia**: El rol debe estar en la lista `[OWNER, SUPERINTENDENT, RESIDENT]`.
3. **Si cumple condición**: Mostrar botón de cerrar incidencia.
4. **Si no cumple**: Ocultar widget de cierre.

---

## 📱↔️💻 ESCENARIOS DE USO INTEGRADO

### Escenario 1: Reporte de Incidencia Crítica

```
TIEMPO  │  MOBILE (RESIDENT)           │  SUPABASE                 │  WEB (D/A)
────────┼──────────────────────────────┼───────────────────────────┼─────────────────────
T+0     │ Detecta fuga de agua         │                           │
T+5s    │ Abre app, crea incidencia    │ INSERT incidents          │
        │ CRITICAL, adjunta 3 fotos    │ (priority=CRITICAL)       │
T+10s   │                              │ Upload 3 fotos a Storage  │
T+12s   │                              │ Realtime broadcast ─────▶ │ Dashboard se actualiza
        │                              │                           │ Alerta visual CRÍTICO
        │                              │                           │
T+20s   │                              │                           │ D/A abre detalle
T+25s   │                              │ ◀─ SELECT photos          │ Ve galería de fotos
T+30s   │                              │ UPDATE incidents ◀────────│ Asigna a CABO disponible
        │                              │ (assigned_to=cabo_id)     │
        │                              │ (status=ASSIGNED)         │
T+32s   │                              │ Realtime broadcast ─────▶ │
        │                              │ Notif a CABO ───────────▶│
T+35s   │ CABO recibe notif in-app     │                           │
T+40s   │ CABO abre app, ve asignación │                           │ Dashboard muestra
        │                              │                           │ ASSIGNED
```

### Escenario 2: Comunicación sobre Incidencia

```
TIEMPO  │  WEB (D/A)                   │  SUPABASE                 │  MOBILE (RESIDENT)
────────┼──────────────────────────────┼───────────────────────────┼─────────────────────
T+0     │ Abre detalle de incidencia   │                           │
T+5s    │ Escribe: "¿Puedes verificar  │ INSERT comments ─────────▶│ App muestra notif
        │  si la válvula está abierta?"│ Realtime broadcast ─────▶│ local si está abierto
T+15s   │                              │                           │ RESIDENT abre app
T+20s   │                              │                           │ Lee comentario
T+25s   │                              │ ◀─ INSERT comments ───────│ Responde: "Verificado
        │ Ve respuesta en tiempo real  │                           │  válvula OK"
T+30s   │                              │ ◀─ UPDATE incidents ──────│ Cierra incidencia
        │ Dashboard se actualiza       │ (status=CLOSED)           │
```

---

## 📋 CHECKLIST DE INTEGRACIÓN

### Fase 1: Setup Compartido

- [ ] Configurar proyecto Supabase único
- [ ] Implementar Custom Access Token Hook
- [ ] Definir ENUMs compartidos (incident_type, status, priority)
- [ ] Crear políticas RLS que funcionan para ambas plataformas

### Fase 2: Auth Integrado

- [ ] Web: Login con Supabase Auth
- [ ] Mobile: Login con Supabase Auth (persistencia local)
- [ ] Validar que JWT claims funcionan en ambos clientes
- [ ] Probar logout/password change cruzado

### Fase 3: Data Flow

- [ ] Mobile: Crear incidencia → Web: Ver en dashboard (Realtime)
- [ ] Web: Asignar incidencia → Mobile: Recibir asignación (Realtime)
- [ ] Mobile: Subir foto → Web: Ver en galería (Storage)
- [ ] Ambos: Thread de comentarios bidireccional (Realtime)

### Fase 4: Notificaciones Realtime

- [ ] Suscripciones Realtime configuradas en ambas plataformas
- [ ] Notificaciones locales in-app funcionando
- [ ] Edge Function para envío de emails de invitación
- [ ] Deep links funcionando

### Fase 5: Testing Integrado

- [ ] E2E: Flujo completo desde Mobile hasta Web
- [ ] E2E: Flujo completo desde Web hasta Mobile
- [ ] Stress test: Múltiples usuarios simultáneos
- [ ] Offline test: Sincronización al reconectar

---

## 📚 REFERENCIAS

- Ver `STROP_WEB_PLATFORM.md` para especificación de la plataforma web
- Ver `STROP_MOBILE_APP.md` para especificación de la app móvil
- Ver `supabase-strop-schema.sql` para schema de base de datos
- Ver `REQUIREMENTS_MVP.md` para requerimientos de negocio

---

## 🎯 RESUMEN DE OBJETIVOS CUMPLIDOS

| Objetivo | Cómo Web + Mobile lo cumplen juntos |
|----------|--------------------------------------|
| **Obj 1: Agilizar captura** | Mobile captura datos rápido → Web los visualiza al instante via Realtime |
| **Obj 2: Centralizar flujo** | Ambos usan mismos ENUMs y DB → Datos consistentes y organizados |
| **Obj 3: Acelerar decisiones** | Comentarios bidireccionales + Notificaciones Realtime = comunicación instantánea |
