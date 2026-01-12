# 🎯 SUPABASE BEST PRACTICES - STROP

> **Basado en**: Schema SQL v3.1 optimizado + Documentación oficial de Supabase
> **Última actualización**: Enero 11, 2026
> **Aplicable a**: Mobile App (Flutter) y Web Platform (Next.js)

---

## 📚 ÍNDICE

1. [Autenticación y JWT](#autenticaci%C3%B3n-y-jwt)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [Data API / PostgREST](#data-api--postgrest)
4. [Realtime](#realtime)
5. [Storage](#storage)
6. [Performance](#performance)
7. [Security Checklist](#security-checklist)

---

## 🔐 AUTENTICACIÓN Y JWT

### Inicialización del Cliente

**Mobile (Dart/Flutter)**:
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

await Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key', // Publishable Key (SAFE para cliente)
  authOptions: FlutterAuthClientOptions(
    authFlowType: AuthFlowType.pkce, // PKCE para seguridad en mobile
  ),
);
```

**Web (JavaScript/TypeScript)**:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Publishable Key
  {
    auth: {
      flowType: 'pkce', // PKCE para mayor seguridad
      autoRefreshToken: true, // Auto-refresh antes de expiración
      persistSession: true, // Persistir en localStorage/cookies
    },
  }
)
```

### Custom Claims en JWT

El `custom_access_token_hook` definido en el schema agrega automáticamente:

```json
{
  "sub": "auth-user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "current_org_id": "uuid-de-organizacion",
  "current_org_role": "RESIDENT",
  "user_id": "uuid-usuario-interno",
  "organizations": [
    {
      "org_id": "uuid-org",
      "role": "RESIDENT"
    }
  ],
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Acceder a claims**:

```dart
// Flutter
final session = supabase.auth.currentSession;
final orgId = session?.user.userMetadata?['current_org_id'];
```

```typescript
// JavaScript
const session = await supabase.auth.getSession()
const orgId = session.data.session?.user.user_metadata.current_org_id
```

### ⚠️ CRÍTICO: Seguridad de Keys

| Key Type | Uso | Exposición | Notas |
|----------|-----|------------|-------|
| `anon` / publishable key | Cliente (Web/Mobile) | ✅ SAFE para cliente | Respeta RLS policies |
| `service_role` key | **SOLO servidor** | ❌ NUNCA en cliente | Bypasea RLS completamente |

```typescript
// ❌ NUNCA HACER ESTO EN CLIENTE
const supabase = createClient(url, SERVICE_ROLE_KEY) // Bypasea RLS!

// ✅ CORRECTO - Usar en servidor
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY) // Solo en API routes
```

---

## 🔒 ROW LEVEL SECURITY (RLS)

### Patrón de Performance Recomendado

**❌ MAL** (sin caching):
```sql
CREATE POLICY "policy_name"
ON table_name FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id -- Se ejecuta múltiples veces por query
);
```

**✅ BIEN** (con caching via select):
```sql
CREATE POLICY "policy_name"
ON table_name FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id -- Se cachea, 99.94% más rápido
);
```

Según documentación oficial de Supabase, el patrón `(select auth.uid())` mejora performance en **99.94%** (de 171ms a 9ms).

### Ejemplo de Policy Multi-Tenant

```sql
CREATE POLICY "Users can view incidents in their org"
ON incidents FOR SELECT
TO authenticated
USING (
  organization_id = (select auth.jwt()->>'current_org_id')::UUID
);
```

### Validar con Rol

```sql
CREATE POLICY "Only OWNER can delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  organization_id = (select auth.jwt()->>'current_org_id')::UUID
  AND (select auth.jwt()->>'current_org_role') = 'OWNER'
);
```

### Security Definer Functions

Cuando necesitas bypassear RLS para operaciones específicas:

```sql
CREATE FUNCTION switch_organization(target_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del creador
SET search_path = public
AS $$
BEGIN
  -- Validar que el usuario pertenece a la org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    AND organization_id = target_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  UPDATE users
  SET current_organization_id = target_org_id
  WHERE auth_id = auth.uid();
END;
$$;
```

---

## 📡 DATA API / PostgREST

### Client Libraries vs Direct REST

**Recomendado: Usar Client Libraries**

```dart
// Flutter
final response = await supabase
    .from('incidents')
    .select('*')
    .eq('project_id', projectId);
```

```typescript
// JavaScript
const { data, error } = await supabase
  .from('incidents')
  .select('*')
  .eq('project_id', projectId)
```

### Relaciones (Foreign Keys)

**Traer datos relacionados en una sola query**:

```typescript
const { data } = await supabase
  .from('incidents')
  .select(`
    *,
    projects:project_id (
      id,
      name,
      location
    ),
    photos (
      id,
      storage_path
    ),
    created_user:created_by (
      full_name,
      role
    )
  `)
```

### Filtros Complejos

```typescript
// OR conditions
.or('priority.eq.CRITICAL,status.eq.OPEN')

// IN filter
.in('status', ['OPEN', 'ASSIGNED'])

// Range
.gte('created_at', startDate)
.lte('created_at', endDate)

// Text search (requiere configuración de índices)
.textSearch('title', 'keyword', { config: 'spanish' })
```

### Paginación

```typescript
// Offset pagination
.range(0, 9) // Primera página de 10 items
.range(10, 19) // Segunda página

// Con conteo total
.select('*', { count: 'exact' })
.range(0, 9)
```

### Performance Tips

1. **Limitar campos**: `.select('id, name, status')` en lugar de `*`
2. **Usar índices**: Filtrar por columnas con índices
3. **Limitar resultados**: Siempre usar `.limit()` o `.range()`
4. **Evitar N+1 queries**: Usar relaciones en lugar de queries múltiples

---

## ⚡ REALTIME

### Tipos de Realtime

| Feature | Uso | Escalabilidad | Requiere RLS |
|---------|-----|---------------|--------------|
| **Postgres Changes** | Escuchar cambios en DB | Limitada | ✅ Sí |
| **Broadcast** | Mensajes cliente-a-cliente | Excelente | Opcional |
| **Presence** | Estado compartido (online/typing) | Muy buena | Opcional |

### Postgres Changes

**Habilitar replication**:
```sql
-- Dashboard > Database > Publications
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

**Suscribirse a cambios**:

```dart
// Flutter
final channel = supabase
  .channel('table-changes')
  .onPostgresChanges(
    event: PostgresChangeEvent.all, // INSERT, UPDATE, DELETE, *
    schema: 'public',
    table: 'incidents',
    filter: PostgresChangeFilter(
      type: PostgresChangeFilterType.eq,
      column: 'project_id',
      value: projectId,
    ),
    callback: (payload) {
      // Payload contiene new/old record
      print(payload.newRecord);
    },
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

```typescript
// JavaScript
const channel = supabase
  .channel('table-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'incidents',
      filter: 'project_id=eq.' + projectId,
    },
    (payload) => {
      console.log(payload.new)
    }
  )
  .subscribe()

// Cleanup
channel.unsubscribe()
```

### ⚠️ Limitaciones de Postgres Changes

1. **DELETE events no son filtrables** (limitación de Postgres WAL)
2. **Performance depende de RLS**: Con 100 usuarios = 100 evaluaciones de RLS por evento
3. **No escala masivamente**: Para >10K usuarios concurrentes, usar Broadcast

### Broadcast (Recomendado para Alta Escala)

```typescript
// JavaScript - Enviar mensaje
const channel = supabase.channel('room-1')
await channel.subscribe()

channel.send({
  type: 'broadcast',
  event: 'message',
  payload: { text: 'Hello!' },
})

// Recibir mensajes
channel.on('broadcast', { event: 'message' }, (payload) => {
  console.log(payload)
})
```

### Broadcast desde Database (Nuevo en v3.1)

Usar `realtime.broadcast_changes()` en triggers para enviar eventos:

```sql
CREATE TRIGGER handle_incident_changes
AFTER INSERT OR UPDATE OR DELETE ON incidents
FOR EACH ROW
EXECUTE FUNCTION broadcast_incident_changes();

CREATE FUNCTION broadcast_incident_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'incidents:' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    'incidents',
    'public',
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📦 STORAGE

### Buckets

**Privados vs Públicos**:

| Bucket Type | Acceso | Uso | Performance |
|-------------|--------|-----|-------------|
| **Privado** | Requiere auth | Documentos sensibles | Normal |
| **Público** | URL directo | Imágenes públicas | Mejor (CDN) |

### Upload de Archivos

```dart
// Flutter - Upload simple
await supabase.storage
    .from('incident-photos')
    .upload(
      'path/to/file.jpg',
      File('local/path.jpg'),
      fileOptions: FileOptions(
        contentType: 'image/jpeg',
        upsert: false, // No sobrescribir
      ),
    );

// Upload resumable (>6MB)
await supabase.storage
    .from('incident-photos')
    .uploadBinary(
      'path/to/large-file.jpg',
      await File('local/path.jpg').readAsBytes(),
    );
```

### RLS Policies en Storage

```sql
-- Upload policy
CREATE POLICY "Users can upload to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'current_org_id')
);

-- Download policy  
CREATE POLICY "Users can download from their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'current_org_id')
);
```

### Signed URLs (Buckets Privados)

```dart
// Generar URL firmada con expiración
final signedUrl = await supabase.storage
    .from('incident-photos')
    .createSignedUrl(
      'path/to/file.jpg',
      60 * 60, // Expira en 1 hora
    );

// Usar en Image widget
Image.network(signedUrl)
```

### Image Transformations

```dart
// Redimensionar al descargar
final url = supabase.storage
    .from('incident-photos')
    .getPublicUrl(
      'path/to/image.jpg',
      transform: TransformOptions(
        width: 500,
        height: 500,
        resize: 'cover',
      ),
    );
```

---

## 🚀 PERFORMANCE

### Database Query Optimization

1. **Usar índices existentes**:
   - `organization_id`, `project_id`, `status`, `assigned_to` ya tienen índices
   - Filtrar por estas columnas es rápido

2. **Patrón (select ...) en RLS**:
   ```sql
   (select auth.uid()) = user_id -- 99.94% más rápido
   ```

3. **Limitar resultados**:
   ```typescript
   .limit(50) // No traer más de lo necesario
   ```

4. **Evitar SELECT ***:
   ```typescript
   .select('id, title, status') // Traer solo campos necesarios
   ```

### Realtime Performance

1. **Filtros server-side**:
   ```typescript
   filter: 'project_id=eq.xxx' // Reduce payload
   ```

2. **Unsubscribe siempre**:
   ```typescript
   useEffect(() => {
     const channel = supabase.channel('...')
     // ...
     return () => channel.unsubscribe() // Cleanup
   }, [])
   ```

3. **Considerar Broadcast para alta escala**:
   - Postgres Changes: Bueno para <1K usuarios concurrentes
   - Broadcast: Excelente para >10K usuarios

### Storage Performance

1. **Comprimir imágenes antes de subir**:
   ```dart
   final resized = img.copyResize(image, width: 1920);
   final compressed = img.encodeJpg(resized, quality: 80);
   ```

2. **Usar CDN para buckets públicos**:
   - Activar Smart CDN en Dashboard
   - Cache automático en Cloudflare

3. **Resumable uploads para archivos grandes**:
   ```dart
   .uploadBinary() // Para archivos >6MB
   ```

---

## ✅ SECURITY CHECKLIST

### Autenticación

- [ ] Usar PKCE flow en mobile y web
- [ ] Auto-refresh tokens habilitado
- [ ] NUNCA exponer `service_role` key en cliente
- [ ] Validar email en producción
- [ ] Implementar CAPTCHA en formularios públicos

### RLS Policies

- [ ] Todas las tablas en `public` schema tienen RLS habilitado
- [ ] Policies usan patrón `(select auth.uid())` para performance
- [ ] Policies validan `organization_id` del JWT
- [ ] Triggers auto-populan `organization_id` y `created_by`
- [ ] NUNCA confiar en datos del cliente para campos de seguridad

### Data API

- [ ] Limitar resultados con `.limit()` o `.range()`
- [ ] Filtrar por columnas con índices
- [ ] Usar relaciones en lugar de múltiples queries
- [ ] Validar errores de RLS en cliente

### Realtime

- [ ] Siempre hacer `unsubscribe()` al desmontar componentes
- [ ] Usar filtros server-side
- [ ] Considerar rate limiting para broadcast
- [ ] Monitorear conexiones concurrentes

### Storage

- [ ] RLS policies en `storage.objects` configuradas
- [ ] Validar tamaño de archivos antes de upload
- [ ] Comprimir imágenes en cliente
- [ ] Usar signed URLs para buckets privados
- [ ] Configurar MIME types permitidos en bucket

### General

- [ ] Logs de auditoría habilitados (`audit_logs` table)
- [ ] Backups configurados (PITR recomendado)
- [ ] Monitorear uso de recursos en Dashboard
- [ ] Rate limiting configurado para APIs críticas
- [ ] SSL enforcement habilitado en producción

---

## 📖 REFERENCIAS

- [Supabase Official Docs](https://supabase.com/docs)
- [RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
- [Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [PostgREST API Reference](https://postgrest.org/en/stable/references/api.html)

---

**Última revisión**: Enero 11, 2026 | **Schema version**: v3.1
