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

**Implementación en JavaScript/TypeScript**:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 1. Configurar suscripción al montar componente
useEffect(() => {
  const channel = supabase
    .channel('dashboard-incidents')
    .on<Database['public']['Tables']['incidents']['Row']>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'incidents',
        filter: `project_id=eq.${selectedProjectId}`, // Filtro server-side
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        const newIncident = payload.new
        
        // Actualización optimista del estado
        setIncidents(prev => [newIncident, ...prev])
        
        // Mostrar notificación toast
        toast({
          title: '¡Nueva incidencia!',
          description: newIncident.title,
          variant: 'default',
        })
      }
    )
    .subscribe()

  // 2. Cleanup al desmontar
  return () => {
    channel.unsubscribe()
  }
}, [selectedProjectId])
```

**IMPORTANTE - Performance RLS con Realtime**:
- Cada evento INSERT dispara evaluación de RLS policies
- Con 100 usuarios suscritos = 100 "reads" por cada INSERT
- Usar filtros server-side (`filter: `) para reducir payload
- Considerar usar Broadcast para alta escala en lugar de Postgres Changes

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

**Lado Web (Asignación con RLS Optimizado):**

```typescript
// Asignar incidencia a un usuario
const { data, error } = await supabase
  .from('incidents')
  .update({
    assigned_to: selectedUserId,
    status: 'ASSIGNED'
  })
  .eq('id', incidentId)
  .select(`
    id,
    title,
    assigned_to:users!incidents_assigned_to_fkey(
      id,
      full_name,
      email
    )
  `)
  .single()

if (error) {
  console.error('Error assigning incident:', error)
} else {
  console.log('Incident assigned to:', data.assigned_to.full_name)
  // Este UPDATE dispara Realtime hacia Mobile
}
```

**⚡ Performance: RLS Policies (Schema v3.2)**

Las policies usan el patrón `(select auth.uid())` para cachear `auth.uid()`:

```sql
-- Política UPDATE optimizada (Schema v3.2)
CREATE POLICY "Users can update incidents"
ON incidents FOR UPDATE
TO authenticated
USING (
  (select auth.jwt() ->> 'current_org_id')::uuid = organization_id
  AND (
    -- OWNER/SUPERINTENDENT pueden editar todo
    (select auth.jwt() ->> 'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
    OR
    -- RESIDENT puede cerrar si está asignado
    (
      (select auth.jwt() ->> 'current_org_role') = 'RESIDENT'
      AND assigned_to = (select auth.uid())
      AND status = 'ASSIGNED'
    )
  )
);
```

Esto resulta en **99.94% de mejora de performance** comparado con `auth.uid()` directo.

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

**Arquitectura de JWT con Custom Claims**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE AUTH                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Custom Access Token Hook                      │    │
│  │                                                                  │    │
│  │  function custom_access_token_hook(event JSONB)                 │    │
│  │  returns JSONB language plpgsql                                 │    │
│  │                                                                  │    │
│  │  Agrega claims personalizados al JWT:                           │    │
│  │  - current_org_id: UUID de organización actual                  │    │
│  │  - current_org_role: OWNER | SUPERINTENDENT | RESIDENT | CABO   │    │
│  │  - user_id: ID interno en public.users                          │    │
│  │  - organizations: Array de orgs del usuario                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │         JWT Token Structure              │
        │                                          │
        │  {                                       │
        │    "sub": "auth-user-uuid",              │
        │    "email": "user@example.com",          │
        │    "role": "authenticated",              │
        │    "current_org_id": "org-uuid",         │
        │    "current_org_role": "RESIDENT",       │
        │    "user_id": "internal-user-uuid",      │
        │    "organizations": [                    │
        │      {                                   │
        │        "org_id": "org-uuid",             │
        │        "role": "RESIDENT"                │
        │      }                                   │
        │    ],                                    │
        │    "iat": 1234567890,                    │
        │    "exp": 1234571490                     │
        │  }                                       │
        └──────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────┐            ┌──────────────┐
        │  MOBILE APP  │            │  WEB PLATFORM│
        │              │            │              │
        │  - Dart/     │            │  - JS/TS     │
        │    Flutter   │            │    Next.js   │
        │  - Supabase  │            │  - Supabase  │
        │    Flutter   │            │    JS        │
        └──────────────┘            └──────────────┘
```

### Inicialización del Cliente por Plataforma

**Mobile (Dart/Flutter)**:
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

await Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key', // Publishable key (safe para cliente)
  authOptions: FlutterAuthClientOptions(
    authFlowType: AuthFlowType.pkce, // PKCE flow para mobile (seguro)
  ),
);

final supabase = Supabase.instance.client;

// Login
final response = await supabase.auth.signInWithPassword(
  email: email,
  password: password,
);

// Acceder a custom claims
final jwt = response.session?.accessToken;
// supabase-flutter parsea automáticamente y disponibiliza en:
// response.session?.user.userMetadata
```

**Web (JavaScript/TypeScript)**:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce', // PKCE para mayor seguridad
      autoRefreshToken: true, // Auto-refresh antes de expiración
      persistSession: true, // Persistir en localStorage
      detectSessionInUrl: true, // Para magic links y OAuth
    },
  }
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

// Acceder a custom claims desde JWT
const jwt = data.session?.access_token
// Decodificar JWT para leer claims (no validar en cliente)
const claims = JSON.parse(atob(jwt.split('.')[1]))
console.log(claims.current_org_id) // UUID de la org actual
```    │
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

**⚡ RLS Policies (Schema v3.2):**

```sql
-- SELECT: Ver fotos de mi organización
CREATE POLICY "Users can view organization photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND (storage.foldername(name))[1] = (select auth.jwt() ->> 'current_org_id')
);

-- INSERT: Subir fotos a mi organización
CREATE POLICY "Users can upload organization photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos'
  AND (storage.foldername(name))[1] = (select auth.jwt() ->> 'current_org_id')
);

-- DELETE: Prohibido (preservar evidencia)
-- No hay política DELETE - Storage es append-only para evidencia
```

**Operaciones por Plataforma:**

| Operación | Web | Mobile | Notas |
|-----------|-----|--------|-------|
| SELECT | ✅ Galeria | ✅ Visualizar | URLs firmadas |
| INSERT | ❌ | ✅ Upload resumable | Mobile captura fotos |
| DELETE | ❌ | ❌ | Evidencia inmutable |

**Validación de Path (Trigger en Schema v3.2):**

```sql
-- Trigger: validate_storage_path_organization
-- Previene inconsistencias entre storage_path y organization_id
CREATE TRIGGER validate_storage_path_organization
  BEFORE INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION validate_storage_path_matches_org();
```

**Path esperado:** `{org_id}/{project_id}/{incident_id}/{uuid}.jpg`

**Ejemplo:** `abc123-org-uuid/proj456-uuid/inc789-uuid/photo-uuid-1234.jpg`

#### Bucket: `org-assets` (Público)

| Operación | Política | Condición SQL | Web | Mobile |
|-----------|----------|---------------|-----|--------|
| SELECT | Público | `bucket_id = 'org-assets'` | ✅ | ✅ |
| INSERT | Upload own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ✅ |
| UPDATE | Update own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ✅ |
| DELETE | Delete own org | `(storage.foldername(name))[1] = get_user_org_id()::text` | ✅ | ❌ |

### Flujo de Fotos: Mobile → Storage → Web

#### Flujo de Datos: Mobile Sube Foto (Resumable Upload)

**🔑 RECOMENDACIÓN:** Usar TUS protocol para confiabilidad en conexiones de campo.

```dart
// Mobile (Dart/Flutter)
import 'package:tus_client/tus_client.dart';

Future<String?> uploadPhotoResumable(
  File photoFile,
  String projectId,
  String incidentId,
) async {
  final session = supabase.auth.currentSession;
  if (session == null) return null;
  
  // 1. Comprimir imagen antes de subir
  final compressedFile = await compressImage(
    photoFile,
    maxWidth: 1920,
    quality: 80,
  );
  
  // 2. Generar path único
  final orgId = session.user.userMetadata?['current_org_id'];
  final fileName = '${Uuid().v4()}.jpg';
  final storagePath = '$orgId/$projectId/$incidentId/$fileName';
  
  // 3. Upload resumable
  try {
    final client = TusClient(
      Uri.parse(
        'https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable',
      ),
      compressedFile,
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

    await client.upload();
    return storagePath;
  } catch (e) {
    print('Upload failed: $e');
    return null;
  }
}
```

#### Flujo de Datos: Web Muestra Galería de Fotos

```typescript
// Web (TypeScript/React)
interface IncidentPhoto {
  id: string
  storage_path: string
  uploaded_at: string
  signedUrl?: string
}

async function loadIncidentPhotos(incidentId: string): Promise<IncidentPhoto[]> {
  // 1. Consultar paths de fotos
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, storage_path, uploaded_at')
    .eq('incident_id', incidentId)
    .order('uploaded_at', { ascending: true })
  
  if (error || !photos) return []
  
  // 2. Generar URLs firmadas (1 hora de expiración)
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data: signedUrl } = await supabase.storage
        .from('incident-photos')
        .createSignedUrl(photo.storage_path, 3600) // 1 hora
      
      return {
        ...photo,
        signedUrl: signedUrl?.signedUrl
      }
    })
  )
  
  // 3. Filtrar URLs válidas
  return photosWithUrls.filter(p => p.signedUrl)
}

// Uso en componente React
function PhotoGallery({ incidentId }: { incidentId: string }) {
  const [photos, setPhotos] = useState<IncidentPhoto[]>([])
  
  useEffect(() => {
    loadIncidentPhotos(incidentId).then(setPhotos)
  }, [incidentId])
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <img 
          key={photo.id}
          src={photo.signedUrl}
          alt="Incident photo"
          className="rounded-lg"
        />
      ))}
    </div>
  )
}
```

**🎯 Best Practices:**
- ✅ Mobile: Comprimir antes de subir (reduce tiempo y costo)
- ✅ Web: URLs firmadas con expiración corta (seguridad)
- ✅ Validar cantidad de fotos (max 5 por incidencia)
- ✅ Usar resumable uploads para archivos >1MB

---

## 📡 CANALES REALTIME COMPARTIDOS

### Arquitectura de Canales

| Canal | Evento | Suscriptores | Propósito |
|-------|--------|--------------|-----------|
| `project:{id}:incidents` | INSERT | Web (dashboard), Mobile (opcional) | Nuevas incidencias |
| `project:{id}:incidents` | UPDATE | Web (dashboard), Mobile (lista) | Cambios de estado/asignación |
| `incident:{id}:comments` | INSERT | Web (detalle), Mobile (detalle) | Thread de comentarios |
| `user:{id}:assignments` | UPDATE incidents | Mobile | Notificar nuevas asignaciones |

### Mejores Prácticas de Realtime

**⚠️ Limitaciones de Postgres Changes:**

- Procesamiento en single thread (compute upgrades no ayudan)
- Con 100 usuarios suscritos = 100 evaluaciones de RLS por evento
- DELETE events no soportan filtros (limitación de Postgres WAL)

**🔑 Recomendaciones por Escala:**

| Usuarios Concurrentes | Estrategia | Implementación |
|----------------------|------------|------------------|
| <50 | Postgres Changes | Filtros server-side |
| 50-100 | Postgres Changes optimizado | RLS policies cacheadas con `(select auth.uid())` |
| >100 | **Broadcast** | Triggers custom + Realtime Authorization |

**Ejemplo: Broadcast para Alta Escala**

```sql
-- 1. Crear función para emitir Broadcast
CREATE OR REPLACE FUNCTION broadcast_incident_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'incidents:' || NEW.project_id::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear trigger
CREATE TRIGGER incidents_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION broadcast_incident_changes();
```

```typescript
// Client-side (Web/Mobile)
const channel = supabase
  .channel(`incidents:${projectId}`, {
    config: { private: true } // Requiere Realtime Authorization
  })
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    console.log('New incident:', payload)
    setIncidents(prev => [payload.new, ...prev])
  })
  .on('broadcast', { event: 'UPDATE' }, (payload) => {
    console.log('Updated incident:', payload)
    setIncidents(prev => prev.map(i => 
      i.id === payload.new.id ? payload.new : i
    ))
  })
  .subscribe()
```

**Ventajas de Broadcast:**
- ✅ No evalúa RLS por cada subscriber (mejor performance)
- ✅ Más flexible para custom payloads
- ✅ Escala mejor con muchos usuarios

---

## 🎯 MATRIZ DE DECISIÓN: POSTGRES CHANGES VS BROADCAST

| Criterio | Postgres Changes | Broadcast |
|----------|------------------|----------|
| **Setup Complexity** | ✅ Simple (built-in) | ⚠️ Requiere triggers |
| **Performance <50 users** | ✅ Excelente | ✅ Excelente |
| **Performance >100 users** | ❌ Bottleneck | ✅ Escala bien |
| **RLS Enforcement** | ✅ Automático | ⚠️ Manual en trigger |
| **Filtros Server-side** | ✅ Sí (column filters) | ⚠️ En trigger |
| **Custom Payloads** | ❌ Solo datos de tabla | ✅ Cualquier JSON |
| **DELETE Events** | ❌ No filtrables | ✅ Filtrables |

**Decisión para STROP:**
- **MVP (Fase 1):** Usar Postgres Changes con filtros server-side
- **Escala (Fase 2):** Migrar a Broadcast cuando >100 usuarios concurrentes

---

## ✅ CHECKLIST DE INTEGRACIÓN

### Mobile App
- [ ] Implementar `signInWithPassword` con custom claims
- [ ] Usar patrón RLS optimizado en queries (`(select auth.uid())`)
- [ ] Configurar resumable uploads para fotos (TUS protocol)
- [ ] Implementar retry logic para conexiones inestables
- [ ] Suscribirse a Postgres Changes con filtros server-side
- [ ] Validar límite de 5 fotos por incidencia
- [ ] Limpiar suscripciones Realtime en unmount/dispose
- [ ] Comprimir imágenes antes de upload (max 1920px, 80% quality)

### Web Platform
- [ ] Configurar SSR con `@supabase/ssr`
- [ ] Implementar queries con filtros explícitos
- [ ] Optimizar joins con foreign key names
- [ ] Generar URLs firmadas para fotos (expiración 1-2 horas)
- [ ] Usar Broadcast para >100 usuarios (opcional Fase 2)
- [ ] Validar RLS policies en dashboard
- [ ] Configurar error monitoring (Sentry/etc)
- [ ] Implementar paginación con `.limit()` y `.range()`

### Integración General
- [ ] Verificar JWT claims incluyen `current_org_id` y `current_org_role`
- [ ] Testear RLS policies con diferentes roles (OWNER, RESIDENT, CABO)
- [ ] Validar storage path vs organization_id consistency
- [ ] Documentar custom functions y triggers
- [ ] Implementar health checks para Realtime
- [ ] Configurar rate limiting en Edge Functions
- [ ] Setup monitoring de Storage usage
- [ ] Testear flujo completo: Mobile crea → Web visualiza → Mobile recibe asignación

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación Oficial Supabase

- [Row Level Security Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Storage Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Server-Side Rendering with SSR](https://supabase.com/docs/guides/auth/server-side-rendering)

### Documentación del Proyecto

- [SUPABASE_INTEGRATION_GUIDE.md](./SUPABASE_INTEGRATION_GUIDE.md) - Guía completa de integración
- [STROP_MOBILE_APP.md](./STROP_MOBILE_APP.md) - Especificación Mobile
- [STROP_WEB_PLATFORM.md](./STROP_WEB_PLATFORM.md) - Especificación Web
- [supabase-strop-schema-optimized-v2.sql](./supabase-strop-schema-optimized-v2.sql) - Schema v3.2
- [REQUIREMENTS_MVP.md](./REQUIREMENTS_MVP.md) - Requerimientos del negocio

### Performance Benchmarks

- RLS con `(select auth.uid())`: **99.94% mejora** vs `auth.uid()` directo
- Realtime Postgres Changes: Hasta 800,000 msgs/sec con Broadcast
- Storage: 500GB max file size (paid plans), 5MB recomendado para mobile
- Custom Access Token Hook: <1ms latency adicional

---

**Fin del documento** - Para preguntas o actualizaciones, consultar documentación oficial de Supabase o el equipo de desarrollo.
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

La vista `bitacora_timeline` unifica eventos de diferentes fuentes para el timeline de bitácora. Utiliza JSONB para almacenar metadata flexible:

```sql
CREATE OR REPLACE VIEW bitacora_timeline AS
SELECT
    'INCIDENT'::event_source AS event_source,
    i.id,
    i.project_id,
    i.organization_id,
    i.created_at AS event_date,
    i.created_by AS event_user,
    jsonb_build_object(
        'type', i.type,
        'title', i.title,
        'description', i.description,
        'status', i.status,
        'priority', i.priority,
        'assigned_to', i.assigned_to,
        'location', i.location
    ) AS event_data
FROM public.incidents i

UNION ALL

SELECT
    'INCIDENT'::event_source AS event_source,
    c.id,
    i.project_id,
    c.organization_id,
    c.created_at AS event_date,
    c.author_id AS event_user,
    jsonb_build_object(
        'incident_id', c.incident_id,
        'text', c.text,
        'parent_type', 'comment'
    ) AS event_data
FROM public.comments c
INNER JOIN public.incidents i ON i.id = c.incident_id

UNION ALL

SELECT
    b.event_source,
    b.id,
    b.project_id,
    b.organization_id,
    b.created_at AS event_date,
    b.created_by AS event_user,
    jsonb_build_object(
        'title', b.title,
        'content', b.content,
        'metadata', b.metadata
    ) AS event_data
FROM public.bitacora_entries b

ORDER BY event_date DESC;
```

**Configuración de Seguridad:** `ALTER VIEW public.bitacora_timeline SET (security_invoker = true);`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `event_source` | event_source | Fuente del evento ('INCIDENT', 'MANUAL') |
| `id` | UUID | ID del evento original |
| `project_id` | UUID | Proyecto asociado |
| `organization_id` | UUID | Organización (para RLS) |
| `event_date` | TIMESTAMPTZ | Fecha del evento ordenada DESC |
| `event_user` | UUID | ID del usuario que creó el evento |
| `event_data` | JSONB | Datos flexibles (tipo, title, description, status, priority, etc) |

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
