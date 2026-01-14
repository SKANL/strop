# Refactorización Necesaria - Backend Desacoplado

## Progreso de Refactorización

### ✅ COMPLETADAS

#### 1. `/dashboard` (Dashboard principal)
**Estado:** ✅ COMPLETADA  
**Cambios realizados:**
- ✅ Creado `dashboard.actions.ts` con 3 server actions
- ✅ Refactorizada `dashboard/page.tsx`
- ✅ Agregado `export const dynamic = 'force-dynamic'`
- ✅ Build exitoso: 0 TypeScript errors

#### 2. `/projects` (Listado de proyectos)
**Estado:** ✅ COMPLETADA  
**Cambios realizados:**
- ✅ Creada acción `getProjectsAction()` en `projects.actions.ts`
- ✅ Refactorizada `projects/page.tsx`
- ✅ Agregado `export const dynamic = 'force-dynamic'`
- ✅ Build exitoso: 0 TypeScript errors

#### 3. `/incidents` (Incidencias)
**Estado:** ✅ COMPLETADA  
**Cambios realizados:**
- ✅ Creada acción `getIncidentsAction()` en `incidents.actions.ts`
- ✅ Refactorizada `incidents/page.tsx`
- ✅ Agregado `export const dynamic = 'force-dynamic'`
- ✅ Fixed TypeScript errors (IncidentStatus casting)
- ✅ Build exitoso: 0 TypeScript errors

#### 4. `/team` (Equipo)
**Estado:** ✅ COMPLETADA  
**Cambios realizados:**
- ✅ Creada acción `getTeamMembersAction()` en `team.actions.ts`
- ✅ Refactorizada `team/page.tsx`
- ✅ Agregado `export const dynamic = 'force-dynamic'`
- ✅ Fixed TeamMember interface (id, name, projects)
- ✅ Build exitoso: 0 TypeScript errors

---

## Páginas que Aún Necesitan Actualización

### 🔴 CRÍTICAS (Listas de datos)

#### 5. `/bitacora` (Bitácora)
**Estado:** ❌ Consulta directa a Supabase  
**Cambio necesario:**
- Crear `bitacora.actions.ts` con `getBitacoraAction()`, `getBitacoraEntriesAction()`
- Refactorizar `bitacora/page.tsx` para usar server action
- Agregar `export const dynamic = 'force-dynamic'`

**Datos que obtiene:**
- Proyectos de la organización
- Entradas de bitácora por proyecto

---

### 🟡 SECUNDARIAS (Detalles/Edición)

#### 6. `/projects/[id]` (Detalle del proyecto)
**Estado:** ❌ Consulta directa a Supabase  
**Cambio necesario:**
- Crear acción `getProjectDetailAction(projectId)`
- Refactorizar página para usar server action
- Agregar `export const dynamic = 'force-dynamic'`

**Datos que obtiene:**
- Detalles del proyecto
- Miembros del proyecto
- Incidencias asociadas

#### 5. `/projects/[id]/edit` (Edición del proyecto)
**Estado:** ❌ Consulta directa a Supabase  
**Cambio necesario:**
- Usar acción existente `getProjectDetailAction(projectId)`
- Agregar `export const dynamic = 'force-dynamic'`

---

### 🟢 YA ACTUALIZADAS (Patrón correcto)

✅ `/dashboard` - Usa `getDashboardStatsAction()`, etc.
✅ `/projects` - Usa `getProjectsAction()`
✅ Todas las acciones CREATE/UPDATE/DELETE en `projects.actions.ts`

---

## Patrón a Seguir

### 1. Crear Server Actions
```typescript
// src/app/actions/[feature].actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export async function get[Feature]Action(): Promise<ActionResult<Data[]>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    // Validar usuario y organización
    const { data: profile } = await authService.getUserProfile()
    if (!profile?.current_organization_id) {
      return { success: false, error: 'No organization' }
    }

    // Obtener datos con validación
    const { data, error } = await supabase
      .from('table')
      .select('...')
      .eq('organization_id', profile.current_organization_id)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Error' }
  }
}
```

### 2. Refactorizar Página
```typescript
// Agregar en la página
import { get[Feature]Action } from '@/app/actions/[feature].actions'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await get[Feature]Action()
  
  if (!result.success) {
    return <div>Error: {result.error}</div>
  }
  
  const data = result.data || []
  
  return (
    // UI con data
  )
}
```

---

## Prioridad de Implementación

1. **INMEDIATA** (Afecta funcionalidad principal)
   - `/incidents` ← Usada constantemente
   - `/team` ← Gestión crítica

2. **CORTO PLAZO** (Mejora consistencia)
   - `/bitacora`
   - `/projects/[id]`
   - `/projects/[id]/edit`

3. **FUTURO** (Si hay más páginas)
   - Settings (profile, organization, notifications, security)
   - Cualquier página con datos dinámicos

---

## Beneficios de la Refactorización Completa

✅ **Arquitectura Consistente** - Todas las páginas usan el mismo patrón
✅ **Seguridad Centralizada** - AuthService en un único lugar
✅ **Error Handling Uniforme** - Mismo formato de errores
✅ **Testeable** - Server actions pueden testearse independientemente
✅ **Mantenible** - Cambios en lógica de negocio en un lugar
✅ **RLS Policies** - Validadas correctamente en cada consulta
✅ **Auditable** - Fácil agregar logging centralizado

---

## Checklist de Validación

Para cada página refactorizada validar:

- [ ] Server action creada con `'use server'`
- [ ] Usa `createAuthService` para validar usuario
- [ ] Validación de `current_organization_id`
- [ ] Manejo de errores con try-catch
- [ ] Retorna `ActionResult<T>`
- [ ] Página importa la server action
- [ ] Página tiene `export const dynamic = 'force-dynamic'`
- [ ] Página llama la action con `await`
- [ ] Página maneja `success: false`
- [ ] Página renderiza datos de `result.data`
- [ ] Build exitoso (npm run build)
- [ ] Sin errores TypeScript
