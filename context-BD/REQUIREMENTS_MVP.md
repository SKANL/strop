# 📋 REQUERIMIENTOS DEL PROYECTO - STROP MVP

> **Versión:** MVP 1.0 (Scope simplificado para validación)
> **Estado:** Definido
> **Última actualización:** Enero 9, 2026
> **Base:** Derivado de REQUIREMENTS_V2.md

---

## 🎯 OBJETIVO DEL MVP

> **Propósito:** Definir el alcance mínimo para validar la idea de negocio con constructoras reales.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                                     |
| :----------- | :---------------------------------------------------------------------------------------------- |
| **QUÉ**      | Un SaaS para gestión de incidencias en obras de construcción                                    |
| **POR QUÉ**  | Las constructoras pierden tiempo comunicando problemas por WhatsApp, llamadas o visitas físicas |
| **QUÉ HACE** | Permite reportar, asignar y cerrar incidencias en tiempo real con evidencia fotográfica         |
| **CÓMO**     | Plataforma web para D/A + API para app móvil futura, con base de datos compartida en Supabase   |

> **Objetivo General:**
> "Optimizar la gestión operativa de los proyectos de construcción mediante una plataforma digital que agilice el reporte de incidencias en tiempo real, centralizando la comunicación entre el campo y la oficina para reducir los tiempos de respuesta."

### Objetivos Específicos

1. **Agilizar la captura de información en campo:** Sustituir reportes verbales por registro digital de incidencias en segundos.
2. **Centralizar y organizar el flujo de incidencias:** Consolidar reportes en un canal único que clasifique automáticamente por tipo, urgencia y proyecto.
3. **Acelerar la toma de decisiones:** Notificaciones inmediatas para resolver incidencias sin detener el avance de obra.

---

## 🏗️ ARQUITECTURA MVP

> **Propósito:** Definir la estructura funcional de la plataforma MVP.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                      |
| :----------- | :------------------------------------------------------------------------------- |
| **QUÉ**      | Plataforma web administrativa con API REST                                       |
| **POR QUÉ**  | Los D/A necesitan visibilidad ejecutiva desde cualquier dispositivo con internet |
| **QUÉ HACE** | Proporciona dashboard, gestión de proyectos, bitácora y configuración del tenant |
| **CÓMO**     | Frontend web + Backend con BD relacional, autenticación, storage y realtime      |

### PLATAFORMA: WEB ADMIN

**Usuarios:** D/A (Dueño/Administrador)

**Funcionalidades MVP:**

| ID     | Función             | QUÉ hace                                                           |
| :----- | :------------------ | :----------------------------------------------------------------- |
| RF-A01 | Crear Proyectos     | Dar de alta obras con nombre, ubicación, fechas                    |
| RF-A02 | Asignar Usuarios    | Vincular personal a proyectos con roles (S, R, C)                  |
| RF-C03 | Dashboard Ejecutivo | Ver KPIs consolidados de incidencias                               |
| RF-B06 | Búsqueda/Filtrado   | Consultar historial de incidencias con filtros                     |
| RF-C04 | Bitácora Digital    | Ver historial inmutable y cronológico + generar borradores legales |
| -      | Gestión de Usuarios | Crear, editar, activar/desactivar usuarios                         |
| -      | Configuración       | Gestionar organización y cuotas del tenant                         |

**❌ ELIMINADO DEL MVP:**

| ID       | Función                   | Razón de exclusión                    |
| :------- | :------------------------ | :------------------------------------ |
| RF-A03   | Cargar Ruta Crítica       | Captura de datos será manual          |
| RF-A03.1 | Plantillas de Importación | Depende de RF-A03                     |
| RF-B02   | Alertas Urgentes (tab)    | Simplificado a notificaciones básicas |
| RF-B05   | Solicitar Material        | Feature de materiales eliminada       |
| RF-B05.1 | Indicador de Desviación   | Depende de materiales                 |
| -        | Ver Auditoría             | Bitácora cubre esta funcionalidad     |
| -        | Exportar PDF/Excel        | Post-MVP                              |

---

## 📦 MÓDULOS MVP

### 1. INCIDENCIAS (Core)

> **Propósito:** Módulo central del negocio - el "producto" que vendemos.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                        |
| :----------- | :--------------------------------------------------------------------------------- |
| **QUÉ**      | Sistema de registro y seguimiento de eventos/problemas en obra                     |
| **POR QUÉ**  | Sin esto no hay SaaS - es la propuesta de valor principal                          |
| **QUÉ HACE** | Permite crear, asignar, dar seguimiento y cerrar incidencias con evidencia         |
| **CÓMO**     | Formularios con validación, fotos en storage, workflow de estados con permisos RLS |

**Flujo:**

```
CREAR → OPEN → ASIGNAR → ASSIGNED → CERRAR → CLOSED
```

**Campos requeridos:**

- `type`: Tipo de incidencia (enum predefinido)
- `description`: Texto libre (max 1000 chars)
- `priority`: NORMAL | CRITICAL
- `status`: OPEN | ASSIGNED | CLOSED
- `photos`: 1-5 fotos obligatorias
- `project_id`: Proyecto asociado
- `created_by`: Usuario que crea
- `assigned_to`: Usuario responsable (opcional)
- `closed_at`, `closed_by`, `closed_notes`: Al cerrar

**Tipos de incidencia MVP:**

- Órdenes e Instrucciones
- Solicitudes y Consultas
- Certificaciones
- Notificaciones de Incidentes

> **NOTA:** "Solicitud de Material" ELIMINADO del MVP

---

### 2. BITÁCORA OPERATIVA (Diferenciador)

> **Propósito:** Centro de Verdad Única (CVU) - diferenciador competitivo clave.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                                                        |
| :----------- | :----------------------------------------------------------------------------------------------------------------- |
| **QUÉ**      | Timeline cronológico de todos los eventos del proyecto con generación de documentos legales                        |
| **POR QUÉ**  | La Bitácora de Obra (BESOP) es un documento legal obligatorio en México - automatizarla es valor diferencial       |
| **QUÉ HACE** | Agrega eventos de múltiples fuentes, permite seleccionar y generar borrador oficial, cierra días con inmutabilidad |
| **CÓMO**     | Agregador de eventos con filtros por fuente, OfficialComposer para redacción, cierre con PIN                       |

**Fuentes de eventos:**

| Fuente   | Descripción                            |
| :------- | :------------------------------------- |
| ALL      | Todos los eventos                      |
| INCIDENT | Incidencias creadas/asignadas/cerradas |
| MANUAL   | Notas manuales del usuario             |
| MOBILE   | Eventos de la app móvil (futuro)       |
| SYSTEM   | Acciones automáticas del sistema       |

**OfficialComposer (Diferenciador clave):**

| Aspecto      | Descripción                                                                         |
| :----------- | :---------------------------------------------------------------------------------- |
| **QUÉ**      | Panel lateral para generar borradores de bitácora oficial                           |
| **POR QUÉ**  | Ahorra horas de redacción manual al ingeniero residente                             |
| **QUÉ HACE** | Selecciona eventos, genera texto formateado legalmente, permite copiar y cerrar día |
| **CÓMO**     | Estado de selección, template de texto con datos de eventos, confirmación con PIN   |

- Seleccionar eventos del timeline
- Generar borrador de Bitácora Oficial (BESOP)
- Copiar texto formateado legalmente
- Cerrar día con PIN (inmutabilidad)

---

### 3. PROYECTOS

> **Propósito:** Contenedor organizacional para agrupar incidencias y equipos.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                              |
| :----------- | :----------------------------------------------------------------------- |
| **QUÉ**      | Registro de obras de construcción con equipo asignado                    |
| **POR QUÉ**  | Las incidencias deben estar contextualizadas en una obra específica      |
| **QUÉ HACE** | Agrupa incidencias, miembros y métricas por obra                         |
| **CÓMO**     | CRUD con validación, tabs de navegación, filtros por proyecto en queries |

**Campos mínimos:**

- `name`: Nombre del proyecto
- `location`: Ubicación
- `start_date`, `end_date`: Fechas
- `owner_id`: Superintendente responsable
- `status`: ACTIVE | PAUSED | COMPLETED

**Tabs en detalle:**

1. Overview (KPIs del proyecto)
2. Incidencias (lista filtrable)
3. Miembros (equipo asignado)

### 4. CONFIGURACIÓN (Multi-tenant)

> **Propósito:** Gestión del tenant (organización) y preferencias de usuario.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                                  |
| :----------- | :------------------------------------------------------------------------------------------- |
| **QUÉ**      | Panel de administración del tenant y perfil de usuario                                       |
| **POR QUÉ**  | En un SaaS multi-tenant, cada organización necesita ver sus límites y personalizar su cuenta |
| **QUÉ HACE** | Muestra cuotas de uso, permite editar perfil y datos de organización                         |
| **CÓMO**     | Componentes UI con estado local, indicador de cuota que consume datos de la API              |

**Hub principal:**

- Perfil del usuario actual
- Cuota del tenant (QuotaIndicator)
  - Almacenamiento usado/total
  - Usuarios actuales/límite
  - Proyectos activos/límite
- Toggle de tema (dark/light)

**Sub-páginas MVP:**

| Página       | Contenido                  |
| :----------- | :------------------------- |
| Perfil       | Nombre, email, foto        |
| Organización | Nombre empresa, logo, plan |

### 5. DASHBOARD + USUARIOS

> **Propósito:** Vista ejecutiva y gestión del equipo.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                             |
| :----------- | :-------------------------------------------------------------------------------------- |
| **QUÉ**      | Panel de control con métricas y gestión de usuarios del tenant                          |
| **POR QUÉ**  | El D/A necesita visibilidad rápida del estado general y control de accesos              |
| **QUÉ HACE** | Muestra KPIs de incidencias, lista proyectos, permite CRUD de usuarios                  |
| **CÓMO**     | KPI cards con datos agregados, tabla de usuarios con filtros, formularios de invitación |

**Dashboard KPIs:**

- Incidencias abiertas
- Incidencias asignadas
- Incidencias cerradas
- Incidencias críticas
- Widget de proyectos

**Gestión de Usuarios:**

- Lista con filtros
- Crear/editar usuario
- Activar/desactivar
- Asignar rol: OWNER | SUPERINTENDENT | RESIDENT | CABO

---

## 2️⃣ ENTIDADES DEL DOMINIO (SCHEMA SQL MVP)

> **Propósito:** Definir estructura de base de datos simplificada para el MVP.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                                 |
| :----------- | :------------------------------------------------------------------------------------------ |
| **QUÉ**      | 7 tablas PostgreSQL en Supabase con relaciones y constraints                                |
| **POR QUÉ**  | Necesitamos persistencia estructurada con integridad referencial y aislamiento multi-tenant |
| **QUÉ HACE** | Almacena organizaciones, usuarios, proyectos, incidencias, fotos y comentarios              |
| **CÓMO**     | PostgreSQL con UUIDs, enums, foreign keys, RLS policies, timestamps con timezone            |

### Tablas MVP (7 tablas)

```
organizations ─┬── users (4 roles)
               ├── projects ─┬── incidents ─┬── photos
               │             │              └── comments
               └─────────────┴── project_members
```

---

### 2.0 - Tabla ORGANIZATIONS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                         |
| :----------- | :------------------------------------------------------------------ |
| **QUÉ**      | Tabla raíz que representa cada empresa constructora (tenant)        |
| **POR QUÉ**  | Multi-tenant requiere segregación de datos por cliente              |
| **QUÉ HACE** | Define límites de cuota, identifica el tenant, habilita facturación |
| **CÓMO**     | Todas las demás tablas tienen `organization_id` que referencia aquí |

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador único del tenant

  name VARCHAR(255) UNIQUE NOT NULL,
  -- Nombre de la empresa constructora (ej: "Constructora ABC")

  slug VARCHAR(100) UNIQUE NOT NULL,
  -- Identificador legible para URLs (ej: "constructora-abc")

  logo_url VARCHAR(500),
  -- URL del logo en Supabase Storage

  billing_email VARCHAR(255),
  -- Email para facturación (puede diferir del owner)

  -- Cuotas (esencial para multi-tenant)
  storage_quota_mb INT DEFAULT 5000,
  -- Límite de almacenamiento por plan (5GB default)

  max_users INT DEFAULT 50,
  -- Límite de usuarios por tier

  max_projects INT DEFAULT 100,
  -- Límite de proyectos simultáneos

  plan ENUM('STARTER', 'PROFESSIONAL', 'ENTERPRISE') DEFAULT 'STARTER',
  -- Tier de suscripción

  is_active BOOLEAN DEFAULT TRUE,
  -- Permite suspender organización por falta de pago

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.1 - Tabla USERS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                          |
| :----------- | :----------------------------------------------------------------------------------- |
| **QUÉ**      | Usuarios del sistema con rol y pertenencia a organización                            |
| **POR QUÉ**  | Necesitamos identificar quién hace qué y con qué permisos                            |
| **QUÉ HACE** | Almacena identidad, rol y estado de cada persona                                     |
| **CÓMO**     | Vinculado a auth.users de Supabase, role para RBAC, organization_id para aislamiento |

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Debe coincidir con auth.users.id de Supabase Auth

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Vincula usuario a su tenant

  email VARCHAR(255) NOT NULL,
  -- Email para identificación (auth en Supabase Auth)

  full_name VARCHAR(255) NOT NULL,
  -- Nombre para mostrar en UI

  role ENUM('OWNER', 'SUPERINTENDENT', 'RESIDENT', 'CABO') NOT NULL,
  -- Define permisos (RBAC)

  is_active BOOLEAN DEFAULT TRUE,
  -- Soft delete para mantener historial

  profile_picture_url VARCHAR(500),
  -- Avatar opcional

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(email, organization_id)
  -- Un email puede existir en diferentes organizaciones
);
```

**Campos eliminados (Post-MVP):** `phone`, `timezone`, `language`, `invited_by`

---

### 2.2 - Tabla PROJECTS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                  |
| :----------- | :----------------------------------------------------------- |
| **QUÉ**      | Obras de construcción activas de la organización             |
| **POR QUÉ**  | Las incidencias necesitan contexto - a qué obra pertenecen   |
| **QUÉ HACE** | Agrupa incidencias y equipo por obra, define fechas y estado |
| **CÓMO**     | CRUD simple, referenciado por incidents y project_members    |

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  -- Nombre de la obra (ej: "Torre Norte Plaza Central")

  location VARCHAR(255) NOT NULL,
  -- Dirección o ubicación

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- Fechas planeadas

  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'ACTIVE',
  -- Estado actual del proyecto

  owner_id UUID REFERENCES users(id),
  -- Superintendente responsable

  created_by UUID REFERENCES users(id),
  -- Quién creó el registro

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Campos eliminados (Post-MVP):** `description`, `budget`, `budget_spent`

---

### 2.3 - Tabla PROJECT_MEMBERS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                         |
| :----------- | :------------------------------------------------------------------ |
| **QUÉ**      | Asignación de usuarios a proyectos con rol específico               |
| **POR QUÉ**  | Un usuario puede estar en múltiples proyectos con diferentes roles  |
| **QUÉ HACE** | Vincula usuarios a proyectos, define qué rol tienen en ese proyecto |
| **CÓMO**     | Tabla de relación muchos-a-muchos con rol asignado                  |

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  assigned_role ENUM('SUPERINTENDENT', 'RESIDENT', 'CABO') NOT NULL,
  -- Rol del usuario en ESTE proyecto (puede diferir del rol global)

  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, user_id)
  -- Un usuario solo puede estar una vez por proyecto
);
```

---

### 2.4 - Tabla INCIDENTS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                               |
| :----------- | :---------------------------------------------------------------------------------------- |
| **QUÉ**      | Registro de eventos/problemas reportados en obra                                          |
| **POR QUÉ**  | Es el core del negocio - sin incidencias no hay producto                                  |
| **QUÉ HACE** | Almacena tipo, descripción, prioridad, estado, asignación y cierre                        |
| **CÓMO**     | Workflow de estados (OPEN→ASSIGNED→CLOSED), inmutabilidad post-cierre, fotos relacionadas |

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  type ENUM('ORDER_INSTRUCTION', 'REQUEST_QUERY', 'CERTIFICATION', 'INCIDENT_NOTIFICATION') NOT NULL,
  -- Tipo predefinido (no texto libre)

  description TEXT NOT NULL,
  -- Detalles del evento

  priority ENUM('NORMAL', 'CRITICAL') DEFAULT 'NORMAL',
  -- CRITICAL genera notificación inmediata a D/A

  status ENUM('OPEN', 'ASSIGNED', 'CLOSED') DEFAULT 'OPEN',
  -- Workflow lineal

  created_by UUID NOT NULL REFERENCES users(id),
  -- Quién reportó

  assigned_to UUID REFERENCES users(id),
  -- Responsable actual (opcional)

  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id),
  closed_notes TEXT,
  -- Datos de cierre

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_description_length CHECK (char_length(description) <= 1000)
);
```

**NOTA:** Tipo `MATERIAL_REQUEST` ELIMINADO del MVP.

---

### 2.5 - Tabla PHOTOS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                               |
| :----------- | :-------------------------------------------------------- |
| **QUÉ**      | Fotografías adjuntas a incidencias                        |
| **POR QUÉ**  | La evidencia visual es crítica para verificar incidencias |
| **QUÉ HACE** | Vincula archivos en Storage con incidencias               |
| **CÓMO**     | Referencia a path en Supabase Storage, 1-5 por incidencia |

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  storage_path VARCHAR(500) NOT NULL,
  -- Path en Supabase Storage (ej: "org-123/inc-456/photo-1.jpg")

  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Campos eliminados (Post-MVP):** `metadata` (JSONB con GPS), `file_size`

---

### 2.6 - Tabla COMMENTS

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                 |
| :----------- | :---------------------------------------------------------- |
| **QUÉ**      | Notas y comentarios en incidencias                          |
| **POR QUÉ**  | Permite comunicación asíncrona sobre una incidencia         |
| **QUÉ HACE** | Almacena texto con autor y timestamp                        |
| **CÓMO**     | Tabla simple vinculada a incidents, ordenada por created_at |

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_text_length CHECK (char_length(text) <= 1000)
);
```

## 🔐 RBAC Y PERMISOS MVP

> **Propósito:** Definir quién puede hacer qué en el sistema.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                           |
| :----------- | :-------------------------------------------------------------------- |
| **QUÉ**      | Matriz de permisos por rol para cada acción del sistema               |
| **POR QUÉ**  | La jerarquía de obra (D/A > S > R > C) debe reflejarse en el software |
| **QUÉ HACE** | Restringe acciones según el rol del usuario autenticado               |
| **CÓMO**     | Políticas de seguridad a nivel de fila + validación en backend + UI   |

### Matriz de Permisos

| Acción                   | OWNER | SUPER | RESIDENT | CABO |
| :----------------------- | :---: | :---: | :------: | :--: |
| Ver dashboard            |  ✅   |  ✅   |    ❌    |  ❌  |
| Crear proyecto           |  ✅   |  ❌   |    ❌    |  ❌  |
| Editar proyecto          |  ✅   |  ✅   |    ❌    |  ❌  |
| Asignar miembros         |  ✅   |  ✅   |    ❌    |  ❌  |
| Crear incidencia         |  ✅   |  ✅   |    ✅    |  ✅  |
| Asignar incidencia       |  ✅   |  ✅   |    ✅    |  ❌  |
| Cerrar incidencia        |  ✅   |  ✅   |    ✅    |  ❌  |
| Ver bitácora             |  ✅   |  ✅   |    ✅    |  ✅  |
| Generar borrador BESOP   |  ✅   |  ✅   |    ❌    |  ❌  |
| Cerrar día (bitácora)    |  ✅   |  ✅   |    ❌    |  ❌  |
| Gestionar usuarios       |  ✅   |  ❌   |    ❌    |  ❌  |
| Ver/editar configuración |  ✅   |  ❌   |    ❌    |  ❌  |

---

## ⚡ CAPACIDADES TÉCNICAS REQUERIDAS

> **Propósito:** Definir las capacidades que debe tener la plataforma tecnológica.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                             |
| :----------- | :---------------------------------------------------------------------- |
| **QUÉ**      | Conjunto de capacidades técnicas necesarias para el MVP                 |
| **POR QUÉ**  | Garantizar que la solución pueda cumplir los requerimientos funcionales |
| **QUÉ HACE** | Define qué debe poder hacer el backend/frontend sin especificar cómo    |
| **CÓMO**     | Lista de capacidades agnóstica de tecnología                            |

### Capacidades Incluidas MVP

- ✅ Multi-tenant (aislamiento por organización)
- ✅ Actualizaciones en tiempo real (realtime/websockets)
- ✅ Control de acceso a nivel de fila (Row Level Security)
- ✅ Validación de datos (cliente y servidor)
- ✅ API REST para integraciones
- ✅ Storage de archivos (fotos)
- ✅ Autenticación con JWT

## � SERVICIOS SUPABASE MVP

> **Propósito:** Definir qué servicios de Supabase se usan y cuáles no en el MVP.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                                 |
| :----------- | :-------------------------------------------------------------------------- |
| **QUÉ**      | Análisis de los servicios de Supabase disponibles vs necesarios para el MVP |
| **POR QUÉ**  | Evitar sobre-ingeniería y mantener costos bajos durante validación          |
| **QUÉ HACE** | Define exactamente qué servicios activar y configurar                       |
| **CÓMO**     | Evaluando cada servicio contra los requerimientos del MVP                   |

### Servicios UTILIZADOS ✅

#### 1. Database (PostgreSQL)

| Aspecto            | Descripción                                                       |
| :----------------- | :---------------------------------------------------------------- |
| **QUÉ**            | Base de datos PostgreSQL gestionada                               |
| **POR QUÉ**        | Core de cualquier aplicación - almacenar todas las entidades      |
| **DÓNDE SE USA**   | Todas las tablas: organizations, users, projects, incidents, etc. |
| **CONFIGURACIÓN**  | 7 tablas con enums, constraints, foreign keys                     |
| **COSTO ESTIMADO** | Incluido en plan gratuito hasta 500MB                             |

#### 2. Auth (Autenticación)

| Aspecto            | Descripción                                              |
| :----------------- | :------------------------------------------------------- |
| **QUÉ**            | Sistema de autenticación completo con JWT                |
| **POR QUÉ**        | Los usuarios deben identificarse para acceder al sistema |
| **DÓNDE SE USA**   | Login, registro, sesiones, JWT para RLS                  |
| **MÉTODOS MVP**    | Email + Password (único método para MVP)                 |
| **CONFIGURACIÓN**  | Redirect URLs, email templates en español                |
| **COSTO ESTIMADO** | Incluido en plan gratuito hasta 50K MAU                  |

#### 3. Row Level Security (RLS)

| Aspecto           | Descripción                                                                 |
| :---------------- | :-------------------------------------------------------------------------- |
| **QUÉ**           | Políticas de seguridad a nivel de fila en PostgreSQL                        |
| **POR QUÉ**       | CRÍTICO para multi-tenant - cada organización solo ve sus datos             |
| **DÓNDE SE USA**  | Todas las tablas (filtro por `organization_id`)                             |
| **CÓMO FUNCIONA** | Cada query automáticamente filtra por `auth.uid()` → user → organization_id |
| **POLÍTICAS MVP** | SELECT/INSERT/UPDATE/DELETE por rol y organization_id                       |

```sql
-- Ejemplo: Policy para incidents
CREATE POLICY "Users can view incidents of their organization"
ON incidents FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);
```

#### 4. Storage (Buckets)

| Aspecto            | Descripción                                                              |
| :----------------- | :----------------------------------------------------------------------- |
| **QUÉ**            | Almacenamiento de archivos (fotos de incidencias)                        |
| **POR QUÉ**        | Las incidencias REQUIEREN evidencia fotográfica (1-5 fotos obligatorias) |
| **DÓNDE SE USA**   | Upload de fotos en creación de incidencias                               |
| **TIPO DE BUCKET** | **PRIVADO** (requiere autenticación para descargar)                      |
| **CONFIGURACIÓN**  | `photos` bucket, max 5MB por archivo, solo JPG/PNG/WEBP                  |
| **ESTRUCTURA**     | `{organization_id}/{project_id}/{incident_id}/{filename}`                |
| **RLS STORAGE**    | Políticas que verifican organización del usuario                         |

```toml
# supabase/config.toml
[storage.buckets.photos]
public = false
file_size_limit = "5MiB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
```

#### 5. Realtime (Postgres Changes)

| Aspecto              | Descripción                                                   |
| :------------------- | :------------------------------------------------------------ |
| **QUÉ**              | Suscripciones en tiempo real a cambios en tablas              |
| **POR QUÉ**          | Dashboard y bitácora deben actualizarse sin refrescar página  |
| **DÓNDE SE USA**     | Dashboard (nuevas incidencias), Bitácora (nuevos eventos)     |
| **TABLAS SUSCRITAS** | `incidents`, `comments`                                       |
| **EVENTOS**          | INSERT, UPDATE (no DELETE en MVP)                             |
| **COSTO**            | Incluido en plan gratuito (límite de conexiones concurrentes) |

```typescript
// Ejemplo: Suscripción a nuevas incidencias
supabase
  .channel("incidents-changes")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "incidents" },
    (payload) => console.log("Nueva incidencia:", payload.new)
  )
  .subscribe();
```

---

### Servicios NO UTILIZADOS en MVP ❌

#### 1. Edge Functions

| Aspecto             | Descripción                                                        |
| :------------------ | :----------------------------------------------------------------- |
| **QUÉ**             | Funciones serverless en Deno                                       |
| **POR QUÉ NO MVP**  | Astro Actions + API Routes cubren las necesidades actuales         |
| **CUÁNDO USAR**     | Post-MVP: Webhooks de Stripe, integraciones con servicios externos |
| **ALTERNATIVA MVP** | Astro Actions para formularios, API Routes para endpoints REST     |

#### 2. Vector (pgvector)

| Aspecto             | Descripción                                                |
| :------------------ | :--------------------------------------------------------- |
| **QUÉ**             | Extensión para búsqueda vectorial y embeddings             |
| **POR QUÉ NO MVP**  | No hay búsqueda semántica ni IA en el MVP                  |
| **CUÁNDO USAR**     | Post-MVP: Búsqueda inteligente de incidencias por contexto |
| **ALTERNATIVA MVP** | Búsqueda por texto con `ILIKE` en description              |

#### 3. Cron Jobs (pg_cron)

| Aspecto             | Descripción                                                |
| :------------------ | :--------------------------------------------------------- |
| **QUÉ**             | Tareas programadas dentro de PostgreSQL                    |
| **POR QUÉ NO MVP**  | No hay reportes automáticos ni limpieza de datos           |
| **CUÁNDO USAR**     | Post-MVP: Reportes diarios, limpieza de archivos huérfanos |
| **ALTERNATIVA MVP** | Acciones manuales del usuario                              |

#### 4. Webhooks (Database Webhooks)

| Aspecto             | Descripción                                          |
| :------------------ | :--------------------------------------------------- |
| **QUÉ**             | Triggers que llaman URLs externas                    |
| **POR QUÉ NO MVP**  | No hay integraciones externas (Slack, email, SMS)    |
| **CUÁNDO USAR**     | Post-MVP: Notificaciones a Slack, emails automáticos |
| **ALTERNATIVA MVP** | Notificaciones solo en UI (sin push/email)           |

#### 5. Branching (Database Branching)

| Aspecto             | Descripción                                               |
| :------------------ | :-------------------------------------------------------- |
| **QUÉ**             | Copias de la base de datos para desarrollo/staging        |
| **POR QUÉ NO MVP**  | Un solo ambiente de desarrollo es suficiente inicialmente |
| **CUÁNDO USAR**     | Post-MVP: Cuando haya equipo de desarrollo y CI/CD        |
| **ALTERNATIVA MVP** | Supabase local con `supabase start`                       |

---

### Resumen de Servicios

| Servicio          | MVP | Post-MVP | Uso Principal                |
| :---------------- | :-: | :------: | :--------------------------- |
| Database          | ✅  |    ✅    | Todas las tablas             |
| Auth              | ✅  |    ✅    | Login email/password         |
| RLS               | ✅  |    ✅    | Aislamiento multi-tenant     |
| Storage           | ✅  |    ✅    | Fotos de incidencias         |
| Realtime          | ✅  |    ✅    | Dashboard y bitácora en vivo |
| Edge Functions    | ❌  |    ✅    | Webhooks, integraciones      |
| Vector (pgvector) | ❌  |    ✅    | Búsqueda semántica con IA    |
| Cron Jobs         | ❌  |    ✅    | Reportes automáticos         |
| Database Webhooks | ❌  |    ✅    | Notificaciones externas      |
| Branching         | ❌  |    ✅    | Ambientes de desarrollo      |

---

## �📁 PÁGINAS MVP

> **Propósito:** Definir las rutas de navegación de la aplicación.

**DESCRIPCIÓN SEMÁNTICA:**

| Aspecto      | Descripción                                                       |
| :----------- | :---------------------------------------------------------------- |
| **QUÉ**      | 8 rutas principales de la aplicación web                          |
| **POR QUÉ**  | Cada módulo necesita su página de entrada y subpáginas de detalle |
| **QUÉ HACE** | Define la estructura de navegación y URLs                         |
| **CÓMO**     | Routing con layouts compartidos (implementación según framework)  |

```
/dashboard                         → KPIs + Activity Feed
/dashboard/proyectos               → Lista de proyectos
/dashboard/proyectos/[id]          → Detalle (Overview, Incidencias, Miembros)
/dashboard/bitacora                → Timeline + OfficialComposer
/dashboard/usuarios                → Gestión de usuarios
/dashboard/configuracion           → Hub + Indicador de Cuota
/dashboard/configuracion/perfil    → Editar perfil
/dashboard/configuracion/organizacion → Editar organización
```

## ✅ RESUMEN MVP

| Área          | Alcance MVP                                      |
| :------------ | :----------------------------------------------- |
| Incidencias   | CRUD completo + fotos + comentarios              |
| Bitácora      | Timeline + 5 fuentes + OfficialComposer + Cierre |
| Proyectos     | Lista + Crear + 3 tabs (sin materiales/timeline) |
| Configuración | Hub + Cuota + Perfil + Organización              |
| Dashboard     | KPIs de incidencias + Widget proyectos           |
| Usuarios      | CRUD + 4 roles RBAC                              |

**Objetivo:** Validar el flujo core de incidencias con constructoras reales.
