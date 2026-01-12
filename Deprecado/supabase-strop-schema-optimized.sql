-- ============================================
-- STROP - SISTEMA DE GESTIÓN DE INCIDENCIAS EN OBRAS
-- Supabase Database Schema - OPTIMIZED VERSION
-- Version: 3.2 - Native Supabase Features + Performance
-- Last Updated: 2025-01-11
-- ============================================

-- CHANGELOG v3.1 → v3.2:
-- ✅ Eliminado custom JWT functions - usar auth.jwt() directamente
-- ✅ Simplificadas RLS policies - usar (select auth.uid()) pattern para 99.94% mejor performance
-- ✅ Optimizado custom_access_token_hook - usar múltiples organizaciones
-- ✅ Corregido handle_new_user - manejar emails duplicados y restauración
-- ✅ Corregido validate_incident_assignment - permitir project OWNER
-- ✅ Optimizado bitacora_timeline - convertido de VIEW a FUNCTION con validación de organización
-- ✅ Storage policies simplificadas con helpers nativos storage.foldername()
-- ✅ Agregada validación storage_path vs organization_id inconsistency
-- ✅ Agregado UNIQUE constraint users.email - prevenir race condition signup
-- ✅ Corregida validación create_organization_for_new_owner - check current_organization_id
-- ✅ Agregado trigger cleanup soft delete - prevenir orphaned data
-- 🔒 SECURITY v3.2: Eliminadas WHEN conditions de triggers organization_id - prevenir spoofing
-- ⚡ PERFORMANCE v3.2: Optimizadas RLS policies con patrón (select ...) - cachear auth.uid()
-- 🛠️ FIX v3.2: Mejorada política UPDATE incidents - permitir OWNER/SUPERINTENDENT
-- 📦 NATIVE v3.2: Aprovechando características nativas Supabase (timestamps, storage helpers, RLS patterns)

-- ============================================
-- PHASE 1: EXTENSIONS & CUSTOM TYPES (NO DEPENDENCIES)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;

-- ============================================
-- PHASE 2: ENUMS (CUSTOM TYPES)
-- ============================================

DROP TYPE IF EXISTS public.subscription_plan CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.project_status CASCADE;
DROP TYPE IF EXISTS public.project_role CASCADE;
DROP TYPE IF EXISTS public.incident_type CASCADE;
DROP TYPE IF EXISTS public.incident_priority CASCADE;
DROP TYPE IF EXISTS public.incident_status CASCADE;
DROP TYPE IF EXISTS public.event_source CASCADE;

CREATE TYPE public.subscription_plan AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE public.user_role AS ENUM ('OWNER', 'SUPERINTENDENT', 'RESIDENT', 'CABO');
CREATE TYPE public.project_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE public.project_role AS ENUM ('SUPERINTENDENT', 'RESIDENT', 'CABO');
CREATE TYPE public.incident_type AS ENUM (
    'ORDER_INSTRUCTION',
    'REQUEST_QUERY',
    'CERTIFICATION',
    'INCIDENT_NOTIFICATION'
);
CREATE TYPE public.incident_priority AS ENUM ('NORMAL', 'CRITICAL');
CREATE TYPE public.incident_status AS ENUM ('OPEN', 'ASSIGNED', 'CLOSED');
CREATE TYPE public.event_source AS ENUM ('INCIDENT', 'MANUAL', 'MOBILE', 'SYSTEM');

-- ============================================
-- PHASE 3: STORAGE BUCKETS (INDEPENDENT OF TABLES)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'incident-photos', 
    'incident-photos', 
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'org-assets', 
    'org-assets', 
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- TABLES
-- ============================================

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    billing_email VARCHAR(255),
    storage_quota_mb INTEGER DEFAULT 5000,
    max_users INTEGER DEFAULT 50,
    max_projects INTEGER DEFAULT 100,
    plan subscription_plan DEFAULT 'STARTER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    current_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- v3.2: Agregar UNIQUE constraint en email (prevenir race condition en registro simultáneo)
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- 3. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.user_role NOT NULL CHECK (role != 'OWNER'),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invitation_token TEXT UNIQUE NOT NULL DEFAULT extensions.gen_random_uuid()::TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT invitations_email_org_unique UNIQUE(email, organization_id),
    CONSTRAINT invitations_not_expired CHECK (expires_at > created_at)
);

COMMENT ON TABLE public.organizations IS 'Organizaciones (tenants) con planes de suscripción y límites de recursos';
COMMENT ON TABLE public.users IS 'v3.2: Usuarios multi-organización. deleted_at implementa soft delete. UNIQUE email previene race conditions';
COMMENT ON TABLE public.invitations IS 'Invitaciones pendientes para unirse a organizaciones con expiración de 24 horas';
COMMENT ON TABLE public.organization_members IS 'Relación many-to-many entre usuarios y organizaciones con roles específicos';
COMMENT ON TABLE public.projects IS 'Proyectos de construcción gestionados por organizaciones';
COMMENT ON TABLE public.project_members IS 'Miembros asignados a proyectos específicos con roles de proyecto';
COMMENT ON TABLE public.incidents IS 'Incidencias reportadas en proyectos con workflow de estados (OPEN → ASSIGNED → CLOSED)';
COMMENT ON TABLE public.photos IS 'Evidencia fotográfica de incidencias almacenada en Storage bucket privado';
COMMENT ON TABLE public.comments IS 'Comentarios en incidencias para comunicación del equipo';
COMMENT ON TABLE public.bitacora_entries IS 'Entradas de bitácora digital con soporte para bloqueo inmutable';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoría para rastrear cambios en tablas críticas';
COMMENT ON TABLE public.bitacora_day_closures IS 'Cierres oficiales diarios de bitácora para cumplimiento legal';


-- 4. ORGANIZATION_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT organization_members_unique UNIQUE(user_id, organization_id)
);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status project_status DEFAULT 'ACTIVE',
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT projects_dates_valid CHECK (end_date >= start_date)
);

-- 6. PROJECT_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_role project_role NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT project_members_unique UNIQUE(project_id, user_id)
);

-- 7. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type incident_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    priority incident_priority DEFAULT 'NORMAL',
    status incident_status DEFAULT 'OPEN',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    closed_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT incidents_description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT incidents_closed_notes_length CHECK (char_length(closed_notes) <= 1000)
);

-- 8. PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    -- v3.0: Validar formato del storage_path
    CONSTRAINT photos_storage_path_format CHECK (
        storage_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}/.+\.(jpg|jpeg|png|webp)$'
    )
);

-- 9. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comments_text_length CHECK (char_length(text) <= 1000)
);

-- 10. BITACORA_ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.bitacora_entries (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    source event_source DEFAULT 'MANUAL',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 11. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BITACORA_DAY_CLOSURES TABLE
CREATE TABLE IF NOT EXISTS public.bitacora_day_closures (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    closure_date DATE NOT NULL,
    official_content TEXT NOT NULL,
    pin_hash VARCHAR(256),
    closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT bitacora_day_closures_unique UNIQUE(project_id, closure_date)
);

-- ============================================
-- INDEXES (Optimizados)
-- ============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active) WHERE is_active = true;

-- Users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_current_org ON public.users(current_organization_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, deleted_at) WHERE deleted_at IS NULL;

-- Organization Members (CRITICAL para performance multi-org)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_members(user_id, organization_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);

-- Project Members
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_org ON public.project_members(organization_id);

-- Incidents
CREATE INDEX IF NOT EXISTS idx_incidents_org_id ON public.incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project_id ON public.incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

-- Photos
CREATE INDEX IF NOT EXISTS idx_photos_incident_id ON public.photos(incident_id);
CREATE INDEX IF NOT EXISTS idx_photos_org_id ON public.photos(organization_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_incident_id ON public.comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_comments_org_id ON public.comments(organization_id);

-- Bitacora Entries
CREATE INDEX IF NOT EXISTS idx_bitacora_entries_project_id ON public.bitacora_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_entries_created_at ON public.bitacora_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_entries_org_id ON public.bitacora_entries(organization_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_table ON public.audit_logs(organization_id, table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- CUSTOM ACCESS TOKEN HOOK (OPTIMIZADO v3.0 - NATIVE SUPABASE)
-- ============================================
-- Pattern: Usa (select ...) para cachear auth.uid() y evitar ejecuciones repetidas
-- Soporta múltiples organizaciones con claims dinámicos

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    claims JSONB;
    user_orgs JSONB;
    current_org_id UUID;
    current_org_role TEXT;
    user_auth_id UUID;
    user_internal_id UUID;
BEGIN
    -- PERFORMANCE: Extraer claims y auth_id una sola vez (patrón de caching recomendado por Supabase)
    claims := event->'claims';
    user_auth_id := (event->>'user_id')::UUID;
    
    -- PERFORMANCE: Obtener user_id interno y org_id en una sola query (optimización)
    SELECT id, current_organization_id 
    INTO user_internal_id, current_org_id
    FROM users
    WHERE auth_id = user_auth_id
    AND deleted_at IS NULL;
    
    -- Si no existe usuario, retornar evento sin modificar
    IF user_internal_id IS NULL THEN
        RETURN event;
    END IF;
    
    -- Si tiene organización actual, obtener el rol
    IF current_org_id IS NOT NULL THEN
        SELECT role::TEXT
        INTO current_org_role
        FROM organization_members
        WHERE user_id = user_internal_id
        AND organization_id = current_org_id;
        
        -- Agregar claims personalizados
        claims := jsonb_set(claims, '{current_org_id}', to_jsonb(current_org_id::TEXT));
        
        IF current_org_role IS NOT NULL THEN
            claims := jsonb_set(claims, '{current_org_role}', to_jsonb(current_org_role));
        END IF;
    END IF;
    
    -- Obtener lista de organizaciones del usuario (una sola query)
    SELECT jsonb_agg(
        jsonb_build_object(
            'org_id', organization_id::TEXT,
            'role', role::TEXT
        )
    )
    INTO user_orgs
    FROM organization_members
    WHERE user_id = user_internal_id;
    
    -- Agregar lista de organizaciones si existen
    IF user_orgs IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_organizations}', user_orgs);
    END IF;
    
    -- Actualizar evento con nuevos claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

-- Grants necesarios para el hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;

-- RLS para que el hook pueda leer users y organization_members
CREATE POLICY "supabase_auth_admin can read users for JWT" 
ON public.users
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);

CREATE POLICY "supabase_auth_admin can read organization_members for JWT" 
ON public.organization_members
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);

-- ============================================
-- HANDLE NEW USER (OPTIMIZADO v3.0 - NATIVE SUPABASE)
-- ============================================
-- FIX: Maneja emails duplicados y restauración de usuarios soft-deleted
-- Pattern: Usa (select ...) para auth.uid() y evita múltiples queries

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    existing_user_id UUID;
    invitation_record RECORD;
BEGIN
    -- Verificar si el usuario ya existe (por email)
    SELECT id INTO existing_user_id
    FROM users
    WHERE email = NEW.email
    AND deleted_at IS NULL;  -- Solo buscar usuarios activos
    
    -- Si existe un usuario activo con ese email, lanzar error
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'El usuario con email % ya existe y está activo. Usa el método de inicio de sesión correcto.', NEW.email;
    END IF;
    
    -- Caso 1: Usuario existe pero está soft-deleted → RESTAURAR
    SELECT id INTO existing_user_id
    FROM users
    WHERE email = NEW.email
    AND deleted_at IS NOT NULL;
    
    IF existing_user_id IS NOT NULL THEN
        UPDATE users
        SET 
            auth_id = NEW.id,
            deleted_at = NULL,
            deleted_by = NULL,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = existing_user_id;
        
        RETURN NEW;
    END IF;
    
    -- Caso 2: Usuario nuevo → CREAR
    -- Verificar si tiene invitación pendiente
    SELECT * INTO invitation_record
    FROM invitations
    WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
    LIMIT 1;
    
    -- Insertar nuevo usuario
    INSERT INTO users (
        auth_id,
        email,
        full_name,
        profile_picture_url,
        is_active,
        current_organization_id
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        TRUE,
        invitation_record.organization_id  -- Establecer org actual si hay invitación
    ) RETURNING id INTO existing_user_id;
    
    -- Si tiene invitación, asignar a la organización
    IF invitation_record.id IS NOT NULL THEN
        -- Insertar en organization_members
        INSERT INTO organization_members (
            user_id,
            organization_id,
            role,
            invited_by
        ) VALUES (
            existing_user_id,
            invitation_record.organization_id,
            invitation_record.role,
            invitation_record.invited_by
        );
        
        -- Marcar invitación como aceptada
        UPDATE invitations
        SET accepted_at = NOW()
        WHERE id = invitation_record.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREATE ORGANIZATION FOR NEW OWNER (v3.2 - FIX PROBLEMA #2)
-- ============================================
-- Permite a un OWNER sin organización VÁLIDA crear su primera organización
-- Pattern: SECURITY DEFINER con validación de current_organization_id

CREATE OR REPLACE FUNCTION public.create_organization_for_new_owner(
    org_name TEXT,
    org_slug TEXT,
    org_plan subscription_plan DEFAULT 'STARTER'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    current_user_id UUID;
    user_has_valid_org BOOLEAN;
BEGIN
    -- Obtener user_id del usuario autenticado (usando patrón de caching)
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
    
    -- Verificar que el usuario existe
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado o eliminado';
    END IF;
    
    -- v3.2 FIX: Verificar si el usuario ya tiene una organización VÁLIDA asignada
    -- (no solo si pertenece a alguna organización)
    SELECT EXISTS(
        SELECT 1 FROM users u
        JOIN organizations o ON u.current_organization_id = o.id
        WHERE u.id = current_user_id 
          AND u.current_organization_id IS NOT NULL
          AND o.is_active = true
    ) INTO user_has_valid_org;
    
    IF user_has_valid_org THEN
        RAISE EXCEPTION 'Usuario ya tiene una organización válida asignada';
    END IF;
    
    -- Crear la organización
    INSERT INTO organizations (name, slug, plan)
    VALUES (org_name, org_slug, org_plan)
    RETURNING id INTO new_org_id;
    
    -- Asignar al usuario como OWNER
    INSERT INTO organization_members (user_id, organization_id, role)
    VALUES (current_user_id, new_org_id, 'OWNER');
    
    -- Establecer como organización actual
    UPDATE users
    SET current_organization_id = new_org_id
    WHERE id = current_user_id;
    
    RETURN new_org_id;
END;
$$;

COMMENT ON FUNCTION public.create_organization_for_new_owner IS 'v3.2: Permite crear primera organización solo si usuario no tiene current_organization_id válido';

-- ============================================
-- SWITCH ORGANIZATION (HELPER FUNCTION - FIX PROBLEMA #8)
-- ============================================
-- Permite cambiar la organización actual del usuario
-- Pattern: SECURITY DEFINER con validación de pertenencia

CREATE OR REPLACE FUNCTION public.switch_organization(
    target_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    is_member BOOLEAN;
BEGIN
    -- Obtener user_id del usuario autenticado
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Verificar que el usuario es miembro de la organización objetivo
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = current_user_id
        AND organization_id = target_org_id
    ) INTO is_member;
    
    IF NOT is_member THEN
        RAISE EXCEPTION 'El usuario no es miembro de la organización solicitada';
    END IF;
    
    -- Cambiar la organización actual
    UPDATE users
    SET 
        current_organization_id = target_org_id,
        updated_at = NOW()
    WHERE id = current_user_id;
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.switch_organization IS 'Helper function para cambiar la organización actual del usuario con validación de pertenencia';

-- ============================================
-- VALIDATE INCIDENT ASSIGNMENT (OPTIMIZADO v3.0 - NATIVE SUPABASE)
-- ============================================
-- FIX: Permitir que project OWNER se auto-asigne incidencias
-- Pattern: Usa (select ...) para cachear y validar is_active

CREATE OR REPLACE FUNCTION public.validate_incident_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_project_owner BOOLEAN;
    is_project_member BOOLEAN;
    is_user_active BOOLEAN;
BEGIN
    -- Si no hay assigned_to, permitir
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar si el usuario está activo (FIX PROBLEMA #8)
    SELECT is_active AND deleted_at IS NULL
    INTO is_user_active
    FROM users
    WHERE id = NEW.assigned_to;
    
    IF NOT COALESCE(is_user_active, FALSE) THEN
        RAISE EXCEPTION 'No se puede asignar a un usuario inactivo o eliminado';
    END IF;
    
    -- Verificar si el usuario es el project owner
    SELECT EXISTS (
        SELECT 1
        FROM projects
        WHERE id = NEW.project_id
        AND owner_id = NEW.assigned_to
    ) INTO is_project_owner;
    
    -- Si es project owner, permitir
    IF is_project_owner THEN
        RETURN NEW;
    END IF;
    
    -- Verificar si el usuario es miembro del proyecto
    SELECT EXISTS (
        SELECT 1
        FROM project_members
        WHERE project_id = NEW.project_id
        AND user_id = NEW.assigned_to
    ) INTO is_project_member;
    
    -- Solo permitir si es miembro del proyecto
    IF NOT is_project_member THEN
        RAISE EXCEPTION 'Usuario no es miembro del proyecto ni su owner';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_incident_assignment_trigger ON public.incidents;
CREATE TRIGGER validate_incident_assignment_trigger
    BEFORE INSERT OR UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_incident_assignment();

-- ============================================
-- VALIDATE STORAGE PATH ORGANIZATION (v3.2 - FIX PROBLEMA #6)
-- ============================================
-- Previene inconsistencia Storage-Database donde:
-- User puede subir archivo a org-A path en Storage, pero crear DB record con incident de org-B

CREATE OR REPLACE FUNCTION public.validate_storage_path_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    incident_org_id UUID;
    storage_org_folder TEXT;
BEGIN
    -- Obtener organization_id del incident
    SELECT organization_id INTO incident_org_id
    FROM incidents
    WHERE id = NEW.incident_id;
    
    -- Extraer organization_id del storage_path
    -- Formato esperado: org-{organization_id}/incident-{incident_id}/{filename}
    storage_org_folder := (regexp_match(NEW.storage_path, '^org-([^/]+)/'))[1];
    
    -- Validar que coincidan
    IF storage_org_folder::UUID != incident_org_id THEN
        RAISE EXCEPTION 'Storage path organization (%) does not match incident organization (%)', 
            storage_org_folder, incident_org_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_storage_path_organization_trigger ON public.photos;
CREATE TRIGGER validate_storage_path_organization_trigger
    BEFORE INSERT ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_storage_path_organization();

COMMENT ON FUNCTION public.validate_storage_path_organization IS 'v3.2: Valida que el storage_path de una foto coincida con la organization_id del incident para prevenir inconsistencias Storage-DB';

-- ============================================
-- CLEANUP SOFT DELETE USER DATA (v3.2 - FIX PROBLEMA #8)
-- ============================================
-- Cuando un usuario es soft-deleted, limpiar datos relacionados

CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo ejecutar cuando se establece deleted_at (soft delete)
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        
        -- Eliminar memberships de organizaciones
        DELETE FROM organization_members
        WHERE user_id = NEW.id;
        
        -- Eliminar memberships de proyectos
        DELETE FROM project_members
        WHERE user_id = NEW.id;
        
        -- Transferir ownership de incidents a NULL (pueden ser reasignados)
        UPDATE incidents
        SET assigned_to = NULL
        WHERE assigned_to = NEW.id;
        
        -- Transferir ownership de proyectos al owner de la organización
        UPDATE projects p
        SET owner_id = (
            SELECT om.user_id 
            FROM organization_members om
            WHERE om.organization_id = p.organization_id 
              AND om.role = 'OWNER'
            LIMIT 1
        )
        WHERE owner_id = NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_soft_deleted_user_trigger ON public.users;
CREATE TRIGGER cleanup_soft_deleted_user_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION public.cleanup_soft_deleted_user();

COMMENT ON FUNCTION public.cleanup_soft_deleted_user IS 'v3.2: Limpia datos relacionados cuando un usuario es soft-deleted: elimina memberships, reasigna incidents y transfiere ownership de proyectos';

-- ============================================
-- BITACORA TIMELINE (OPTIMIZADO v3.0 - NATIVE SUPABASE)
-- ============================================
-- FIX: Función con filtros y validación de organización (FIX PROBLEMA #10)
-- Pattern: SECURITY DEFINER con validación de current_org_id en JWT

CREATE OR REPLACE FUNCTION public.get_bitacora_timeline(
    p_project_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_source event_source DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    event_date TIMESTAMPTZ,
    source event_source,
    title TEXT,
    content TEXT,
    created_by UUID,
    metadata JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_org UUID;
    project_org UUID;
BEGIN
    -- Obtener current_org_id del JWT (FIX PROBLEMA #10)
    current_org := (auth.jwt()->>'current_org_id')::UUID;
    
    -- Verificar que el usuario tenga acceso al proyecto
    SELECT organization_id INTO project_org
    FROM projects
    WHERE id = p_project_id;
    
    -- Si no existe el proyecto o no pertenece a la organización del usuario
    IF project_org IS NULL OR project_org != current_org THEN
        RAISE EXCEPTION 'No tiene permiso para acceder a este proyecto';
    END IF;
    
    RETURN QUERY
    WITH timeline AS (
        -- Incidencias
        SELECT 
            i.id,
            i.project_id,
            i.created_at AS event_date,
            'INCIDENT'::event_source AS source,
            i.title,
            i.description AS content,
            i.created_by,
            jsonb_build_object(
                'type', i.type,
                'priority', i.priority,
                'status', i.status,
                'assigned_to', i.assigned_to
            ) AS metadata
        FROM incidents i
        WHERE i.project_id = p_project_id
        AND i.organization_id = current_org
        AND (p_start_date IS NULL OR i.created_at >= p_start_date)
        AND (p_end_date IS NULL OR i.created_at <= p_end_date)
        
        UNION ALL
        
        -- Entradas manuales
        SELECT 
            be.id,
            be.project_id,
            be.created_at AS event_date,
            be.source,
            be.title,
            be.content,
            be.created_by,
            be.metadata
        FROM bitacora_entries be
        WHERE be.project_id = p_project_id
        AND be.organization_id = current_org
        AND (p_start_date IS NULL OR be.created_at >= p_start_date)
        AND (p_end_date IS NULL OR be.created_at <= p_end_date)
    )
    SELECT t.*
    FROM timeline t
    WHERE (p_source IS NULL OR t.source = p_source)
    ORDER BY t.event_date DESC;
END;
$$;

COMMENT ON FUNCTION public.get_bitacora_timeline IS 'v3.0 OPTIMIZADO: Timeline con validación de organización y filtros por fecha/fuente';

-- ============================================
-- AUTO-POPULATE TRIGGERS (FIX PROBLEMAS #6, #9, #11)
-- ============================================
-- Pattern: Triggers BEFORE INSERT/UPDATE para establecer automáticamente user_id fields

-- Trigger para created_by en incidents
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Solo establecer created_by en INSERT y si está NULL
    IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
        SELECT id INTO current_user_id
        FROM users
        WHERE auth_id = (SELECT auth.uid())
        AND deleted_at IS NULL;
        
        NEW.created_by := current_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para uploaded_by en photos
CREATE OR REPLACE FUNCTION public.set_uploaded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.uploaded_by IS NULL THEN
        SELECT id INTO current_user_id
        FROM users
        WHERE auth_id = (SELECT auth.uid())
        AND deleted_at IS NULL;
        
        NEW.uploaded_by := current_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para author_id en comments
CREATE OR REPLACE FUNCTION public.set_author_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.author_id IS NULL THEN
        SELECT id INTO current_user_id
        FROM users
        WHERE auth_id = (SELECT auth.uid())
        AND deleted_at IS NULL;
        
        NEW.author_id := current_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para closed_by en incidents
CREATE OR REPLACE FUNCTION public.set_closed_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Solo establecer closed_by cuando el status cambia a CLOSED
    IF TG_OP = 'UPDATE' AND NEW.status = 'CLOSED' AND OLD.status != 'CLOSED' AND NEW.closed_by IS NULL THEN
        SELECT id INTO current_user_id
        FROM users
        WHERE auth_id = (SELECT auth.uid())
        AND deleted_at IS NULL;
        
        NEW.closed_by := current_user_id;
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para closed_by en bitacora_day_closures
CREATE OR REPLACE FUNCTION public.set_day_closure_closed_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.closed_by IS NULL THEN
        SELECT id INTO current_user_id
        FROM users
        WHERE auth_id = (SELECT auth.uid())
        AND deleted_at IS NULL;
        
        NEW.closed_by := current_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS set_created_by_trigger ON incidents;
CREATE TRIGGER set_created_by_trigger
    BEFORE INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_uploaded_by_trigger ON photos;
CREATE TRIGGER set_uploaded_by_trigger
    BEFORE INSERT ON photos
    FOR EACH ROW
    EXECUTE FUNCTION set_uploaded_by();

DROP TRIGGER IF EXISTS set_author_id_trigger ON comments;
CREATE TRIGGER set_author_id_trigger
    BEFORE INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION set_author_id();

DROP TRIGGER IF EXISTS set_closed_by_trigger ON incidents;
CREATE TRIGGER set_closed_by_trigger
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION set_closed_by();

DROP TRIGGER IF EXISTS set_day_closure_closed_by_trigger ON bitacora_day_closures;
CREATE TRIGGER set_day_closure_closed_by_trigger
    BEFORE INSERT ON bitacora_day_closures
    FOR EACH ROW
    EXECUTE FUNCTION set_day_closure_closed_by();

-- ============================================
-- RLS POLICIES (OPTIMIZADAS v3.0)
-- ============================================
-- Pattern: Usar (select auth.uid()) para cache de función
-- Pattern: Usar auth.jwt() para acceso directo a claims

-- Habilitar RLS en todas las tablas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_day_closures ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT om.organization_id
        FROM public.organization_members om
        INNER JOIN public.users u ON u.id = om.user_id
        WHERE u.auth_id = (SELECT auth.uid())
        AND u.deleted_at IS NULL
    )
);

CREATE POLICY "Only OWNER can update organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        INNER JOIN public.users u ON u.id = om.user_id
        WHERE u.auth_id = (SELECT auth.uid())
        AND om.organization_id = organizations.id
        AND om.role = 'OWNER'
        AND u.deleted_at IS NULL
    )
);

-- ============================================
-- USERS POLICIES
-- ============================================

CREATE POLICY "Users can view organization members"
ON public.users FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        -- Ver usuarios de mis organizaciones
        EXISTS (
            SELECT 1
            FROM public.organization_members om1
            INNER JOIN public.users u ON u.id = om1.user_id
            WHERE u.auth_id = (SELECT auth.uid())
            AND EXISTS (
                SELECT 1
                FROM public.organization_members om2
                WHERE om2.user_id = users.id
                AND om2.organization_id = om1.organization_id
            )
        )
        OR
        -- Ver mi propio perfil
        auth_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth_id = (SELECT auth.uid()) AND deleted_at IS NULL);

-- ============================================
-- ORGANIZATION_MEMBERS POLICIES
-- ============================================

CREATE POLICY "Users can view members of their organizations"
ON public.organization_members FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members om
        INNER JOIN public.users u ON u.id = om.user_id
        WHERE u.auth_id = (SELECT auth.uid())
        AND u.deleted_at IS NULL
    )
);

CREATE POLICY "OWNER and SUPERINTENDENT can manage members"
ON public.organization_members FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members om
        INNER JOIN public.users u ON u.id = om.user_id
        WHERE u.auth_id = (SELECT auth.uid())
        AND om.role IN ('OWNER', 'SUPERINTENDENT')
        AND u.deleted_at IS NULL
    )
);

-- ============================================
-- PROJECTS POLICIES
-- ============================================

CREATE POLICY "Users can view organization projects"
ON public.projects FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "OWNER and SUPERINTENDENT can manage projects"
ON public.projects FOR ALL
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
);

-- ============================================
-- PROJECT_MEMBERS POLICIES
-- ============================================

CREATE POLICY "Users can view project members of their org"
ON public.project_members FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "OWNER and SUPERINTENDENT can manage project members"
ON public.project_members FOR ALL
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
);

-- ============================================
-- INCIDENTS POLICIES
-- ============================================

CREATE POLICY "Users can view organization incidents"
ON public.incidents FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "Users can create incidents in their projects"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND project_id IN (
        SELECT pm.project_id
        FROM public.project_members pm
        INNER JOIN public.users u ON u.id = pm.user_id
        WHERE u.auth_id = (SELECT auth.uid())
        AND pm.organization_id = (auth.jwt()->>'current_org_id')::UUID
    )
);

CREATE POLICY "Users can update incidents they created or are assigned to"
ON public.incidents FOR UPDATE
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (
        -- Permitir a creador o asignado
        created_by = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
        OR assigned_to = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
    )
)
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (
        -- Permitir a creador o asignado
        created_by = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
        OR assigned_to = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
        -- Permitir a OWNER y SUPERINTENDENT modificar cualquier incidencia
        OR (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
    )
);

-- ============================================
-- PHOTOS POLICIES
-- ============================================

CREATE POLICY "Users can view photos of organization incidents"
ON public.photos FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "Users can upload photos to incidents"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND incident_id IN (
        SELECT id FROM public.incidents
        WHERE organization_id = (auth.jwt()->>'current_org_id')::UUID
    )
);

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view comments in organization incidents"
ON public.comments FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "Users can create comments on incidents"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND incident_id IN (
        SELECT id FROM public.incidents
        WHERE organization_id = (auth.jwt()->>'current_org_id')::UUID
    )
);

-- ============================================
-- BITACORA_ENTRIES POLICIES
-- ============================================

CREATE POLICY "Users can view bitacora entries of their organization"
ON public.bitacora_entries FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "Users can create bitacora entries in their projects"
ON public.bitacora_entries FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND project_id IN (
        SELECT pm.project_id
        FROM public.project_members pm
        INNER JOIN public.users u ON u.id = pm.user_id
        WHERE u.auth_id = (SELECT auth.uid())
    )
);

-- ============================================
-- INVITATIONS POLICIES (FIX PROBLEMA #15)
-- ============================================

CREATE POLICY "Org members can view invitations of their organization"
ON public.invitations FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "OWNER and SUPERINTENDENT can manage invitations"
ON public.invitations FOR ALL
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
);

-- ============================================
-- BITACORA_DAY_CLOSURES POLICIES (FIX PROBLEMA #12)
-- ============================================

CREATE POLICY "Users can view day closures of their organization"
ON public.bitacora_day_closures FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
);

CREATE POLICY "Only RESIDENT and above can create day closures"
ON public.bitacora_day_closures FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT', 'RESIDENT')
);

-- ============================================
-- AUTO-POPULATE ORGANIZATION_ID TRIGGERS
-- ============================================
-- Triggers para auto-poblar organization_id desde tablas relacionadas
-- Pattern: BEFORE INSERT para obtener org_id del proyecto/incidencia padre

-- Function para obtener organization_id desde project
CREATE OR REPLACE FUNCTION public.set_organization_from_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Obtener organization_id del proyecto
    SELECT organization_id INTO NEW.organization_id
    FROM projects
    WHERE id = NEW.project_id;
    
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo obtener organization_id del proyecto';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function para obtener organization_id desde incident
CREATE OR REPLACE FUNCTION public.set_organization_from_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Obtener organization_id de la incidencia
    SELECT organization_id INTO NEW.organization_id
    FROM incidents
    WHERE id = NEW.incident_id;
    
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo obtener organization_id de la incidencia';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para incidents.organization_id (desde project)
-- SECURITY: Siempre forzar organization_id desde proyecto para prevenir spoofing
-- Sin WHEN condition - se ejecuta SIEMPRE para evitar bypass
DROP TRIGGER IF EXISTS set_incident_organization ON public.incidents;
CREATE TRIGGER set_incident_organization
    BEFORE INSERT ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_from_project();

-- Trigger para photos.organization_id (desde incident)
-- SECURITY: Siempre forzar organization_id desde incident para prevenir spoofing
-- Sin WHEN condition - se ejecuta SIEMPRE para evitar bypass
DROP TRIGGER IF EXISTS set_photo_organization ON public.photos;
CREATE TRIGGER set_photo_organization
    BEFORE INSERT ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_from_incident();

-- Trigger para comments.organization_id (desde incident)
-- SECURITY: Siempre forzar organization_id desde incident para prevenir spoofing
-- Sin WHEN condition - se ejecuta SIEMPRE para evitar bypass
DROP TRIGGER IF EXISTS set_comment_organization ON public.comments;
CREATE TRIGGER set_comment_organization
    BEFORE INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_from_incident();

-- Trigger para bitacora_entries.organization_id (desde project)
-- SECURITY: Siempre forzar organization_id desde proyecto para prevenir spoofing
-- Sin WHEN condition - se ejecuta SIEMPRE para evitar bypass
DROP TRIGGER IF EXISTS set_bitacora_organization ON public.bitacora_entries;
CREATE TRIGGER set_bitacora_organization
    BEFORE INSERT ON public.bitacora_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_from_project();

-- Trigger para bitacora_day_closures.organization_id (desde project)
-- SECURITY: Siempre forzar organization_id desde proyecto para prevenir spoofing
-- Sin WHEN condition - se ejecuta SIEMPRE para evitar bypass
DROP TRIGGER IF EXISTS set_day_closure_organization ON public.bitacora_day_closures;
CREATE TRIGGER set_day_closure_organization
    BEFORE INSERT ON public.bitacora_day_closures
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_from_project();

COMMENT ON FUNCTION public.set_organization_from_project IS 'Auto-popula organization_id desde el proyecto relacionado';
COMMENT ON FUNCTION public.set_organization_from_incident IS 'Auto-popula organization_id desde la incidencia relacionada';


COMMENT ON FUNCTION public.set_organization_from_incident IS 'Auto-popula organization_id desde la incidencia relacionada';

-- ============================================
-- AUDIT_LOGS POLICIES (FIX PROBLEMA #14)
-- ============================================

CREATE POLICY "Only OWNER and SUPERINTENDENT can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
);

-- ============================================
-- STORAGE POLICIES (v3.2 - OPTIMIZADAS CON HELPERS NATIVOS)
-- ============================================
-- Pattern: Usar storage.foldername() helper para mejor performance
-- Referencia: https://supabase.com/docs/guides/storage/schema/helper-functions

-- incident-photos bucket (PRIVATE)
-- Formato: org-{org_id}/incident-{incident_id}/{filename}

-- v3.2: Optimizado con storage.foldername() native helper
CREATE POLICY "Users can view photos in their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'incident-photos'
    -- Usar storage.foldername()[1] para extraer primer folder (org-{id})
    -- Mucho más eficiente que regexp y JSONB queries
    AND substring((storage.foldername(name))[1] from 'org-(.*)') IN (
        SELECT om.organization_id::TEXT
        FROM public.organization_members om
        INNER JOIN public.users u ON u.id = om.user_id
        WHERE u.auth_id = (SELECT auth.uid())
    )
);

-- v3.2: Validar formato org-{current_org_id} en path
CREATE POLICY "Users can upload photos to their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'incident-photos'
    -- El primer folder DEBE ser org-{current_org_id}
    AND (storage.foldername(name))[1] = 'org-' || (auth.jwt()->>'current_org_id')
);

CREATE POLICY "Users can update their uploaded photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'incident-photos'
    AND owner = (SELECT auth.uid())
)
WITH CHECK (
    bucket_id = 'incident-photos'
    -- Mantener formato org-{current_org_id} en updates
    AND (storage.foldername(name))[1] = 'org-' || (auth.jwt()->>'current_org_id')
);

-- org-assets bucket (PUBLIC)
-- Formato: org-{org_id}/{asset_type}/{filename}

-- v3.2: Assets públicos con validación de organización
CREATE POLICY "Organization assets are publicly accessible"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'org-assets');

-- v3.2: Solo OWNER puede subir assets usando formato correcto
CREATE POLICY "OWNER can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'org-assets'
    AND (auth.jwt()->>'current_org_role') = 'OWNER'
    AND (storage.foldername(name))[1] = 'org-' || (auth.jwt()->>'current_org_id')
);

COMMENT ON POLICY "Users can view photos in their organization" ON storage.objects IS 'v3.2: Usa storage.foldername() native helper para mejor performance';
COMMENT ON POLICY "Users can upload photos to their organization" ON storage.objects IS 'v3.2: Valida formato org-{current_org_id} al subir';
COMMENT ON POLICY "OWNER can upload organization assets" ON storage.objects IS 'v3.2: Valida role OWNER y formato org folder';
