# 🔗 SUPABASE INTEGRATION GUIDE - STROP
> **Versión:** 1.0 - Basado en Schema v3.2
> **Última actualización:** Enero 11, 2026
> **Audiencia:** Desarrolladores Frontend y Backend

---

## 📋 RESUMEN EJECUTIVO

Esta guía detalla **cómo consumir correctamente** la base de datos de Supabase en las plataformas Mobile y Web de STROP, siguiendo las mejores prácticas y optimizaciones del schema v3.2.

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Backend** | Supabase (PostgreSQL) | v3.2 |
| **Auth** | Supabase Auth + Custom Hooks | Latest |
| **Realtime** | Supabase Realtime | Latest |
| **Storage** | Supabase Storage | Latest |
| **RLS** | Row Level Security | Optimized v3.2 |

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### 1. Patrón de Autenticación Recomendado

```typescript
// ✅ CORRECTO - Usando signInWithPassword
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'resident@constructora.com',
  password: 'SecurePassword123!'
})

if (session) {
  // El custom_access_token_hook inyecta automáticamente:
  // - current_org_id (de users.current_organization_id)
  // - current_org_role (de organization_members.role)
  console.log('User authenticated:', session.user.id)
}
```

### 2. Custom Access Token Hook (Schema v3.2)

El schema v3.2 incluye un `custom_access_token_hook` que inyecta automáticamente el contexto de organización en el JWT:

```sql
-- Implementado en schema v3.2
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    current_org_id uuid;
    current_org_role public.user_role;
  begin
    -- Fetch organization context from users table
    select current_organization_id, om.role
    into current_org_id, current_org_role
    from public.users u
    left join public.organization_members om 
      on om.user_id = u.id 
      and om.organization_id = u.current_organization_id
    where u.id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if current_org_id is not null then
      claims := jsonb_set(claims, '{current_org_id}', to_jsonb(current_org_id));
      claims := jsonb_set(claims, '{current_org_role}', to_jsonb(current_org_role));
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;
```

**Beneficios:**
- ✅ Context automático en cada request
- ✅ No necesitas queries adicionales para obtener org_id
- ✅ RLS policies pueden usar `auth.jwt() ->> 'current_org_id'`

### 3. RLS Pattern Optimizado (99.94% mejora de performance)

**❌ INCORRECTO - Sin cacheo:**
```sql
create policy "Users view own incidents"
on incidents for select
using (auth.uid() = created_by);
```

**✅ CORRECTO - Con cacheo (Schema v3.2 pattern):**
```sql
create policy "Users view own incidents"
on incidents for select
to authenticated
using ((select auth.uid()) = created_by);
```

**¿Por qué?**
El patrón `(select auth.uid())` crea un `initPlan` que cachea el resultado de `auth.uid()` por statement, evitando llamarlo en cada fila. Esto resulta en **99.94% de mejora de performance** según benchmarks oficiales de Supabase.

---

## 📊 DATA API - QUERIES OPTIMIZADAS

### 1. Consultas Básicas con Filtros

**Mobile App - Consultar incidencias asignadas:**

```typescript
// ✅ CORRECTO - Con filtros explícitos
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
    project:projects(id, name, location)
  `)
  .eq('assigned_to', session.user.id)  // Filtro explícito
  .neq('status', 'CLOSED')             // Excluir cerradas
  .order('priority', { ascending: false })
  .order('created_at', { ascending: false })
```

**Importancia de Filtros Explícitos:**
> Aunque RLS filtra automáticamente por `organization_id`, agregar filtros explícitos como `.eq('assigned_to', userId)` permite que Postgres construya un query plan más eficiente y use índices apropiados.

### 2. Consultas con Joins Eficientes

```typescript
// ✅ CORRECTO - Select específico con joins
const { data, error } = await supabase
  .from('incidents')
  .select(`
    id,
    title,
    status,
    priority,
    created_at,
    created_by:users!incidents_created_by_fkey(
      id,
      full_name,
      email
    ),
    project:projects(
      id,
      name,
      location
    ),
    photos(
      id,
      storage_path
    )
  `)
  .eq('project_id', projectId)
  .limit(20)
```

**Mejores Prácticas:**
- ✅ Especificar exactamente qué campos necesitas
- ✅ Usar foreign key names para joins específicos
- ✅ Limitar resultados con `.limit()`
- ❌ Evitar `select('*')` en producción

### 3. Inserciones con Auto-población de Campos

**Schema v3.2** incluye triggers que auto-populan campos:

```typescript
// ✅ CORRECTO - Los campos se auto-populan vía triggers
const { data: incident, error } = await supabase
  .from('incidents')
  .insert({
    project_id: projectId,
    type: 'INCIDENT_NOTIFICATION',
    title: 'Fuga de agua en sótano',
    description: 'Detectada fuga importante...',
    priority: 'CRITICAL',
    location: 'Sótano - Esquina NO'
    // ✅ organization_id → auto via trigger
    // ✅ created_by → auto via trigger  
    // ✅ status → default 'OPEN'
    // ✅ created_at → default NOW()
  })
  .select()
  .single()
```

**Triggers activos (Schema v3.2):**
- `set_organization_from_project` → `organization_id`
- `set_created_by` → `created_by`
- `set_uploaded_by` → para photos
- `set_author_id` → para comments

---

## 🔄 REALTIME - MEJORES PRÁCTICAS

### 1. Postgres Changes - Limitaciones de Escala

**⚠️ IMPORTANTE:** Postgres Changes tiene limitaciones de performance en escala:

- Cada evento INSERT/UPDATE dispara evaluación de RLS policies
- Con 100 usuarios suscritos = 100 "reads" por cada INSERT
- Database bottleneck puede limitar throughput de mensajes
- Procesamiento en single thread mantiene orden de cambios

**Recomendación:** Para alta escala, usar **Broadcast** en lugar de Postgres Changes.

### 2. Postgres Changes - Uso Correcto

```typescript
// ✅ CORRECTO - Con filtros server-side
const channel = supabase
  .channel('incident-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'incidents',
      filter: `assigned_to=eq.${userId}` // Filtro server-side
    },
    (payload) => {
      console.log('Incident updated:', payload.new)
      updateLocalState(payload.new)
    }
  )
  .subscribe()

// ⚠️ IMPORTANTE: Siempre limpiar suscripciones
useEffect(() => {
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

**Performance Tips:**
- ✅ Usar filtros server-side (`filter: `)
- ✅ Limitar suscripciones solo a datos necesarios
- ✅ Considerar usar SELECT más específico en policies
- ❌ Evitar suscripciones amplias sin filtros

### 3. Broadcast - Para Alta Escala (Recomendado)

```typescript
// ✅ MEJOR PARA ESCALA - Usando Broadcast con trigger
// Configurar trigger en database:

/*
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

CREATE TRIGGER incidents_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION broadcast_incident_changes();
*/

// Client side (Mobile/Web):
const channel = supabase
  .channel(`incidents:${projectId}`, {
    config: { private: true } // Requiere Realtime Authorization
  })
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    console.log('New incident:', payload)
  })
  .on('broadcast', { event: 'UPDATE' }, (payload) => {
    console.log('Updated incident:', payload)
  })
  .subscribe()
```

**Ventajas de Broadcast:**
- ✅ Mejor performance a escala
- ✅ No evalúa RLS por cada subscriber
- ✅ Más flexible para custom payloads
- ✅ Procesamiento más eficiente

---

## 📦 STORAGE - UPLOAD DE ARCHIVOS

### 1. Configuración del Bucket (Schema v3.2)

```sql
-- Bucket: incident-photos
-- Visibility: PRIVATE
-- Max size: 5MB per file
-- MIME types: image/jpeg, image/png, image/webp
-- Path pattern: {org_id}/{project_id}/{incident_id}/{uuid}.jpg
-- Max files per incident: 5 (validated by trigger)
```

### 2. Upload Standard (Archivos Pequeños)

```typescript
// ✅ CORRECTO - Upload simple para archivos < 6MB
const { data, error } = await supabase.storage
  .from('incident-photos')
  .upload(
    `${org_id}/${project_id}/${incident_id}/${uuidv4()}.jpg`,
    photoFile,
    {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false // No sobrescribir
    }
  )

if (data) {
  // Registrar en tabla photos
  await supabase.from('photos').insert({
    incident_id: incidentId,
    storage_path: data.path
    // organization_id → auto via trigger
    // uploaded_by → auto via trigger
    // uploaded_at → default NOW()
  })
}
```

### 3. Upload Resumable (Archivos Grandes, Mobile Recomendado)

```typescript
// ✅ MEJOR PARA MOBILE - Resumable upload con TUS protocol
import * as tus from 'tus-js-client'

const upload = new tus.Upload(photoFile, {
  endpoint: `https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`,
  retryDelays: [0, 3000, 5000, 10000, 20000],
  headers: {
    authorization: `Bearer ${session.access_token}`,
    'x-upsert': 'false'
  },
  uploadDataDuringCreation: true,
  removeFingerprintOnSuccess: true,
  metadata: {
    bucketName: 'incident-photos',
    objectName: `${org_id}/${project_id}/${incident_id}/${uuid}.jpg`,
    contentType: 'image/jpeg',
    cacheControl: '3600'
  },
  chunkSize: 6 * 1024 * 1024, // 6MB chunks
  onProgress: (bytesUploaded, bytesTotal) => {
    const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
    console.log(`Upload progress: ${percentage}%`)
  },
  onSuccess: () => {
    console.log('Upload complete!')
  },
  onError: (error) => {
    console.error('Upload failed:', error)
  }
})

upload.start()
```

**Ventajas de Resumable Upload:**
- ✅ Resiliencia ante interrupciones de red
- ✅ Progress tracking
- ✅ Mejor UX en conexiones inestables (campo)
- ✅ Soporta archivos grandes

### 4. Validaciones de Storage (Schema v3.2)

```sql
-- Trigger: validate_photo_count
-- Limita a máximo 5 fotos por incidencia

-- Trigger: validate_storage_path_organization  
-- Previene inconsistencias entre storage_path y organization_id
```

**⚠️ IMPORTANTE:** No intentes subir más de 5 fotos por incidencia. El trigger rechazará el INSERT.

---

## 🔒 ROW LEVEL SECURITY (RLS) - POLÍTICAS APLICADAS

### 1. RLS en Incidents (Schema v3.2)

```sql
-- Política SELECT: Ver incidencias de mi organización
CREATE POLICY "Users can view organization incidents"
ON incidents FOR SELECT
TO authenticated
USING ((select auth.jwt() ->> 'current_org_id')::uuid = organization_id);

-- Política INSERT: Crear incidencias en proyectos asignados
CREATE POLICY "Users can create incidents in assigned projects"
ON incidents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = incidents.project_id
      AND user_id = (select auth.uid())
  )
);

-- Política UPDATE: Solo OWNER/SUPERINTENDENT pueden asignar
-- O cerrar si son RESIDENT y assigned_to = auth.uid()
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
      AND status = 'ASSIGNED' -- Solo si ya está asignado
    )
  )
);
```

### 2. RLS en Photos (Schema v3.2)

```sql
-- SELECT: Ver fotos de incidencias accesibles
CREATE POLICY "Users can view photos of accessible incidents"
ON photos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM incidents
    WHERE incidents.id = photos.incident_id
      AND incidents.organization_id = (select auth.jwt() ->> 'current_org_id')::uuid
  )
);

-- INSERT: Crear fotos en incidencias propias o asignadas
CREATE POLICY "Users can upload photos to incidents"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM incidents
    WHERE incidents.id = photos.incident_id
      AND (
        created_by = (select auth.uid())
        OR assigned_to = (select auth.uid())
      )
  )
);
```

### 3. Storage Policies (Schema v3.2)

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
```

**Nota:** `storage.foldername()` es un helper nativo de Supabase que extrae el path hierarchy como array.

---

## 🎯 PATRONES ESPECÍFICOS POR PLATAFORMA

### Mobile App (Flutter/React Native)

**1. Optimizar para Conexiones Inestables:**

```typescript
// ✅ CORRECTO - Implementar retry logic
const uploadWithRetry = async (file: File, maxRetries = 3) => {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      const { data, error } = await supabase.storage
        .from('incident-photos')
        .upload(path, file)
      
      if (error) throw error
      return data
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
    }
  }
}
```

**2. Usar Direct Storage Hostname:**

```typescript
// ✅ MEJOR PERFORMANCE - Direct storage hostname
const PROJECT_ID = 'your-project-id'
const STORAGE_URL = `https://${PROJECT_ID}.storage.supabase.co`

// En lugar de:
// const STORAGE_URL = `https://${PROJECT_ID}.supabase.co`
```

### Web Platform (Next.js/React)

**1. Server-Side Rendering con Auth:**

```typescript
// ✅ CORRECTO - SSR con Supabase Auth (Next.js)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getServerSideProps() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })

  return { props: { incidents } }
}
```

**2. Optimizar Listado de Objetos:**

```sql
-- Para listas grandes de objetos en Storage, crear función custom
CREATE OR REPLACE FUNCTION list_objects(
  bucketid text,
  prefix text,
  limits int default 100,
  offsets int default 0
) RETURNS TABLE (
  name text,
  id uuid,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY 
  SELECT objects.name, objects.id, objects.updated_at
  FROM storage.objects
  WHERE objects.name LIKE prefix || '%'
    AND bucket_id = bucketid
  ORDER BY name ASC
  LIMIT limits OFFSET offsets;
END;
$$ LANGUAGE plpgsql STABLE;
```

```typescript
// Usar la función en lugar de supabase.storage.list()
const { data, error } = await supabase.rpc('list_objects', {
  bucketid: 'incident-photos',
  prefix: `${org_id}/${project_id}/`,
  limits: 100,
  offsets: 0
})
```

---

## 🔍 DEBUGGING Y TROUBLESHOOTING

### 1. Verificar RLS Policies

```sql
-- Ver políticas aplicadas a una tabla
SELECT * FROM pg_policies WHERE tablename = 'incidents';

-- Test policy como usuario específico
SET request.jwt.claims = '{
  "sub": "user-uuid",
  "role": "authenticated",
  "current_org_id": "org-uuid",
  "current_org_role": "RESIDENT"
}';

SELECT * FROM incidents WHERE assigned_to = 'user-uuid';

-- Reset
RESET request.jwt.claims;
```

### 2. Verificar JWT Claims

```typescript
// ✅ CORRECTO - Decodificar JWT para debug
import { jwtDecode } from 'jwt-decode'

const { data: { session } } = await supabase.auth.getSession()
if (session) {
  const jwt = jwtDecode(session.access_token)
  console.log('JWT Claims:', jwt)
  console.log('Current Org ID:', jwt.current_org_id)
  console.log('Current Org Role:', jwt.current_org_role)
}
```

### 3. Verificar Storage Path

```typescript
// ✅ Verificar que storage_path coincide con organization_id
const { data: photos } = await supabase
  .from('photos')
  .select('id, storage_path, organization_id')
  .eq('incident_id', incidentId)

photos.forEach(photo => {
  const pathOrgId = photo.storage_path.split('/')[0]
  if (pathOrgId !== photo.organization_id) {
    console.error('Storage path mismatch!', photo)
  }
})
```

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación Oficial Supabase

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Storage Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)

### Schema STROP v3.2

- [supabase-strop-schema-optimized-v2.sql](./supabase-strop-schema-optimized-v2.sql)
- [REQUIREMENTS_MVP.md](./REQUIREMENTS_MVP.md)

### Performance Benchmarks

- RLS con `(select auth.uid())`: 99.94% mejora
- Realtime Postgres Changes: Hasta 800,000 msgs/sec con Broadcast
- Storage: 500GB max file size (paid plans)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Mobile App
- [ ] Implementar signInWithPassword con custom claims
- [ ] Usar patrón RLS optimizado en queries
- [ ] Configurar resumable uploads para fotos
- [ ] Implementar retry logic para conexiones inestables
- [ ] Suscribirse a Broadcast en lugar de Postgres Changes (si >100 usuarios)
- [ ] Validar límite de 5 fotos por incidencia
- [ ] Limpiar suscripciones Realtime en unmount

### Web Platform
- [ ] Configurar SSR con Supabase Auth
- [ ] Implementar función custom para list_objects
- [ ] Usar filtros explícitos en todas las queries
- [ ] Optimizar joins con foreign key names
- [ ] Implementar Image Transformations para thumbnails
- [ ] Configurar CDN con cache-control alto
- [ ] Validar RLS policies en dashboard

### General
- [ ] Verificar JWT claims incluyen current_org_id
- [ ] Testear RLS policies con diferentes roles
- [ ] Validar storage path vs organization_id consistency
- [ ] Configurar error monitoring (Sentry/etc)
- [ ] Documentar custom functions y triggers
- [ ] Implementar health checks para Realtime

---

**Fin del documento** - Para preguntas o actualizaciones, consultar documentación oficial de Supabase o el equipo de desarrollo.
