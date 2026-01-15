-- ============================================
-- STROP - SISTEMA DE GESTIÓN DE INCIDENCIAS EN OBRAS
-- Supabase Database Schema - OPTIMIZED VERSION
-- Version: 3.2.2 - Native Supabase Features + Performance + Recursion Fix
-- Last Updated: 2026-01-12
-- STATUS: ✅ FULLY SYNCHRONIZED WITH DATABASE
-- ============================================

-- CHANGELOG v3.2.1 → v3.2.2:
-- 🐛 CRITICAL FIX: Eliminada recursión infinita en users RLS policy "Users can view organization members"
--    - Policy antigua consultaba organization_members con JOIN a users dentro de la evaluación de users
--    - Nueva policy "Users can view own profile" simplificada: solo permite ver propio perfil
--    - Eliminado error "infinite recursion detected in policy for relation users"
--    - Dashboard ahora carga correctamente sin errores de recursión

-- CHANGELOG v3.2.2 → v3.2.2.1 (2026-01-12 - VERIFICATION):
-- ✅ VERIFICATION COMPLETED: Schema synchronized with Supabase database
--    - Verified all 12 tables present with correct structure
--    - Verified all 31 RLS policies match between schema file and database
--    - Verified all required extensions installed: uuid-ossp, pgcrypto, pg_stat_statements
--    - Verified no migration tracking (all schema applied via direct SQL)
--    - Dashboard fully operational with dynamic data from database
--    - All mock data removed from frontend components

-- CHANGELOG v3.2 → v3.2.1:
-- 🐛 CRITICAL FIX: Arreglada recursión infinita en organization_members RLS policies
--    - Policies antiguas consultaban organization_members dentro de su evaluación
--    - Nueva versión usa users.current_organization_id y JWT claims
--    - Eliminado error "infinite recursion detected in policy"
--    - Trigger handle_new_user ahora funciona correctamente

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
-- PHASE 4: TABLES (ORDERED BY DEPENDENCIES)
-- ============================================

-- 1. ROOT TABLES (NO FOREIGN KEY DEPENDENCIES)

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

-- 2. USERS TABLE (DEPENDS ON: organizations)

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

ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- 3. INVITATIONS TABLE (DEPENDS ON: organizations, users)

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

-- 4. ORGANIZATION_MEMBERS TABLE (DEPENDS ON: organizations, users)

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT organization_members_unique UNIQUE(user_id, organization_id)
);

-- 5. PROJECTS TABLE (DEPENDS ON: organizations, users)

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

-- 6. PROJECT_MEMBERS TABLE (DEPENDS ON: organizations, projects, users)

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

-- 7. INCIDENTS TABLE (DEPENDS ON: organizations, projects, users)

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

-- 8. PHOTOS TABLE (DEPENDS ON: organizations, incidents, users)

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT photos_storage_path_format CHECK (
        storage_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}/.+\.(jpg|jpeg|png|webp)$'
    )
);

-- 9. COMMENTS TABLE (DEPENDS ON: organizations, incidents, users)

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comments_text_length CHECK (char_length(text) <= 1000)
);

-- 10. BITACORA_ENTRIES TABLE (DEPENDS ON: organizations, projects, incidents, users)

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

-- 11. AUDIT_LOGS TABLE (DEPENDS ON: organizations, users)

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

-- 12. BITACORA_DAY_CLOSURES TABLE (DEPENDS ON: organizations, projects, users)

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
-- PHASE 5: TABLE COMMENTS (AFTER ALL TABLES CREATED)
-- ============================================

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

-- ============================================
-- PHASE 6: INDEXES (AFTER TABLES CREATED)
-- ============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active) WHERE is_active = true;

-- Users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_current_org ON public.users(current_organization_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, deleted_at) WHERE deleted_at IS NULL;

-- Organization Members
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
-- PHASE 7: TRIGGER FUNCTIONS (BEFORE CREATING TRIGGERS)
-- ============================================

-- ============================================
-- HELPER FUNCTIONS FOR AUTO-POPULATING organization_id
-- ============================================

CREATE OR REPLACE FUNCTION public.set_organization_from_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    SELECT organization_id INTO NEW.organization_id
    FROM projects
    WHERE id = NEW.project_id;
    
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo obtener organization_id del proyecto';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_organization_from_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    SELECT organization_id INTO NEW.organization_id
    FROM incidents
    WHERE id = NEW.incident_id;
    
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo obtener organization_id de la incidencia';
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_organization_from_project IS 'Auto-popula organization_id desde el proyecto relacionado';
COMMENT ON FUNCTION public.set_organization_from_incident IS 'Auto-popula organization_id desde la incidencia relacionada';

-- ============================================
-- TRIGGER FUNCTIONS FOR AUTO-POPULATING USER FIELDS
-- ============================================

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
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

CREATE OR REPLACE FUNCTION public.set_closed_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
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

-- ============================================
-- VALIDATION TRIGGER FUNCTIONS
-- ============================================

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
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;
    
    SELECT is_active AND deleted_at IS NULL
    INTO is_user_active
    FROM users
    WHERE id = NEW.assigned_to;
    
    IF NOT COALESCE(is_user_active, FALSE) THEN
        RAISE EXCEPTION 'No se puede asignar a un usuario inactivo o eliminado';
    END IF;
    
    SELECT EXISTS (
        SELECT 1
        FROM projects
        WHERE id = NEW.project_id
        AND owner_id = NEW.assigned_to
    ) INTO is_project_owner;
    
    IF is_project_owner THEN
        RETURN NEW;
    END IF;
    
    SELECT EXISTS (
        SELECT 1
        FROM project_members
        WHERE project_id = NEW.project_id
        AND user_id = NEW.assigned_to
    ) INTO is_project_member;
    
    IF NOT is_project_member THEN
        RAISE EXCEPTION 'Usuario no es miembro del proyecto ni su owner';
    END IF;
    
    RETURN NEW;
END;
$$;

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
    SELECT organization_id INTO incident_org_id
    FROM incidents
    WHERE id = NEW.incident_id;
    
    storage_org_folder := (regexp_match(NEW.storage_path, '^org-([^/]+)/'))[1];
    
    IF storage_org_folder::UUID != incident_org_id THEN
        RAISE EXCEPTION 'Storage path organization (%) does not match incident organization (%)', 
            storage_org_folder, incident_org_id;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_storage_path_organization IS 'v3.2: Valida que el storage_path de una foto coincida con la organization_id del incident para prevenir inconsistencias Storage-DB';

CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        
        DELETE FROM organization_members
        WHERE user_id = NEW.id;
        
        DELETE FROM project_members
        WHERE user_id = NEW.id;
        
        UPDATE incidents
        SET assigned_to = NULL
        WHERE assigned_to = NEW.id;
        
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

COMMENT ON FUNCTION public.cleanup_soft_deleted_user IS 'v3.2: Limpia datos relacionados cuando un usuario es soft-deleted: elimina memberships, reasigna incidents y transfiere ownership de proyectos';

-- ============================================
-- PHASE 8: AUTH TRIGGER & FUNCTIONS (DEPEND ON TABLES)
-- ============================================

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
    SELECT id INTO existing_user_id
    FROM users
    WHERE email = NEW.email
    AND deleted_at IS NULL;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'El usuario con email % ya existe y está activo. Usa el método de inicio de sesión correcto.', NEW.email;
    END IF;
    
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
    
    SELECT * INTO invitation_record
    FROM invitations
    WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
    LIMIT 1;
    
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
        invitation_record.organization_id
    ) RETURNING id INTO existing_user_id;
    
    IF invitation_record.id IS NOT NULL THEN
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
        
        UPDATE invitations
        SET accepted_at = NOW()
        WHERE id = invitation_record.id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CUSTOM ACCESS TOKEN HOOK (DEPENDS ON TABLES)
-- ============================================

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
    claims := event->'claims';
    user_auth_id := (event->>'user_id')::UUID;
    
    SELECT id, current_organization_id 
    INTO user_internal_id, current_org_id
    FROM users
    WHERE auth_id = user_auth_id
    AND deleted_at IS NULL;
    
    IF user_internal_id IS NULL THEN
        RETURN event;
    END IF;
    
    IF current_org_id IS NOT NULL THEN
        SELECT role::TEXT
        INTO current_org_role
        FROM organization_members
        WHERE user_id = user_internal_id
        AND organization_id = current_org_id;
        
        claims := jsonb_set(claims, '{current_org_id}', to_jsonb(current_org_id::TEXT));
        
        IF current_org_role IS NOT NULL THEN
            claims := jsonb_set(claims, '{current_org_role}', to_jsonb(current_org_role));
        END IF;
    END IF;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'org_id', organization_id::TEXT,
            'role', role::TEXT
        )
    )
    INTO user_orgs
    FROM organization_members
    WHERE user_id = user_internal_id;
    
    IF user_orgs IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_organizations}', user_orgs);
    END IF;
    
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

-- Grants for auth hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;

-- ============================================
-- BUSINESS LOGIC FUNCTIONS (DEPEND ON TABLES)
-- ============================================

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
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado o eliminado';
    END IF;
    
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
    
    INSERT INTO organizations (name, slug, plan)
    VALUES (org_name, org_slug, org_plan)
    RETURNING id INTO new_org_id;
    
    INSERT INTO organization_members (user_id, organization_id, role)
    VALUES (current_user_id, new_org_id, 'OWNER');
    
    UPDATE users
    SET current_organization_id = new_org_id
    WHERE id = current_user_id;
    
    RETURN new_org_id;
END;
$$;

COMMENT ON FUNCTION public.create_organization_for_new_owner IS 'v3.2: Permite crear primera organización solo si usuario no tiene current_organization_id válido';

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
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = current_user_id
        AND organization_id = target_org_id
    ) INTO is_member;
    
    IF NOT is_member THEN
        RAISE EXCEPTION 'El usuario no es miembro de la organización solicitada';
    END IF;
    
    UPDATE users
    SET 
        current_organization_id = target_org_id,
        updated_at = NOW()
    WHERE id = current_user_id;
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.switch_organization IS 'Helper function para cambiar la organización actual del usuario con validación de pertenencia';

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
    current_org := (auth.jwt()->>'current_org_id')::UUID;
    
    SELECT organization_id INTO project_org
    FROM projects
    WHERE id = p_project_id;
    
    IF project_org IS NULL OR project_org != current_org THEN
        RAISE EXCEPTION 'No tiene permiso para acceder a este proyecto';
    END IF;
    
    RETURN QUERY
    WITH timeline AS (
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
-- PHASE 9: CREATE ALL TRIGGERS (AFTER ALL FUNCTIONS EXIST)
-- ============================================

-- ============================================
-- AUTO-POPULATE ORGANIZATION_ID TRIGGERS
-- ============================================
-- Triggers para auto-poblar organization_id desde tablas relacionadas
-- Pattern: BEFORE INSERT para obtener org_id del proyecto/incidencia padre

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

-- User field auto-population triggers
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

-- Validation triggers
DROP TRIGGER IF EXISTS validate_incident_assignment_trigger ON public.incidents;
CREATE TRIGGER validate_incident_assignment_trigger
    BEFORE INSERT OR UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_incident_assignment();

DROP TRIGGER IF EXISTS validate_storage_path_organization_trigger ON public.photos;
CREATE TRIGGER validate_storage_path_organization_trigger
    BEFORE INSERT ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_storage_path_organization();

-- Cleanup trigger
DROP TRIGGER IF EXISTS cleanup_soft_deleted_user_trigger ON public.users;
CREATE TRIGGER cleanup_soft_deleted_user_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION public.cleanup_soft_deleted_user();

-- ============================================
-- PHASE 10: ENABLE RLS (BEFORE POLICIES)
-- ============================================

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
-- PHASE 11: RLS POLICIES FOR AUTH HOOK (SPECIAL ACCESS)
-- ============================================

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
-- PHASE 12: RLS POLICIES FOR TABLES
-- ============================================

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

-- FIXED v3.2.2: Eliminada policy recursiva "Users can view organization members"
-- La policy antigua consultaba organization_members con JOIN a users dentro de 
-- la evaluación de la tabla users, causando "infinite recursion detected in policy for relation users"
-- Nueva policy simplificada: usuarios solo pueden ver su propio perfil

CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
    auth_id = (SELECT auth.uid()) 
    AND deleted_at IS NULL
);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth_id = (SELECT auth.uid()) AND deleted_at IS NULL);

-- ============================================
-- ORGANIZATION_MEMBERS POLICIES  
-- ============================================

-- FIXED v3.2.1: Eliminada recursión infinita
-- Las policies antiguas consultaban organization_members dentro de su propia evaluación
-- Nueva versión usa users.current_organization_id y JWT para evitar recursión

CREATE POLICY "Users can view members of their organizations"
ON public.organization_members FOR SELECT
TO authenticated
USING (
    -- Verificar que el usuario autenticado es miembro de la misma organización
    -- SIN consultar organization_members recursivamente
    organization_id IN (
        SELECT current_organization_id
        FROM public.users
        WHERE auth_id = (SELECT auth.uid())
        AND current_organization_id IS NOT NULL
        AND deleted_at IS NULL
    )
);

CREATE POLICY "OWNER can manage all members, SUPERINTENDENT can manage non-OWNER members"
ON public.organization_members FOR ALL
TO authenticated
USING (
    -- Permitir si el usuario es OWNER de la org
    organization_id IN (
        SELECT u.current_organization_id
        FROM public.users u
        WHERE u.auth_id = (SELECT auth.uid())
        AND u.deleted_at IS NULL
        -- Verificar role OWNER sin recursión: usar JWT
        AND (auth.jwt()->>'current_org_role') = 'OWNER'
    )
    OR
    -- O si es SUPERINTENDENT y el target no es OWNER
    (
        organization_id IN (
            SELECT u.current_organization_id
            FROM public.users u
            WHERE u.auth_id = (SELECT auth.uid())
            AND u.deleted_at IS NULL
            AND (auth.jwt()->>'current_org_role') = 'SUPERINTENDENT'
        )
        AND role != 'OWNER'
    )
);

-- ============================================
-- INVITATIONS POLICIES
-- ============================================

CREATE POLICY "Org members can view invitations of their organization"
ON public.invitations FOR SELECT
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

CREATE POLICY "OWNER and SUPERINTENDENT can manage invitations"
ON public.invitations FOR ALL
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
        created_by = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
        OR assigned_to = (
            SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
        )
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
-- BITACORA_DAY_CLOSURES POLICIES
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
-- AUDIT_LOGS POLICIES
-- ============================================

CREATE POLICY "Only OWNER and SUPERINTENDENT can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt()->>'current_org_id')::UUID
    AND (auth.jwt()->>'current_org_role') IN ('OWNER', 'SUPERINTENDENT')
);

-- ============================================
-- PHASE 13: STORAGE POLICIES
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
);- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   F u n c t i o n :   i n i t i a l i z e _ o w n e r _ o r g a n i z a t i o n  
 - -   D e s c r i p t i o n :   C r e a t e s   a   n e w   o r g a n i z a t i o n ,   m a k e s   t h e   c u r r e n t   u s e r   t h e   O W N E R ,    
 - -                             a n d   s e t s   i t   a s   t h e i r   c u r r e n t   c o n t e x t .  
 - -   S e c u r i t y :   S E C U R I T Y   D E F I N E R   ( R u n s   w i t h   p r i v i l e g e s   o f   t h e   c r e a t o r   t o   b y p a s s   R L S    
 - -                       d u r i n g   i n i t i a l   s e t u p   i f   n e e d e d ,   t h o u g h   R L S   s h o u l d   a l l o w   I N S E R T s   f o r   a u t h ' d   u s e r s )  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . i n i t i a l i z e _ o w n e r _ o r g a n i z a t i o n (  
         o r g _ n a m e   T E X T ,  
         p l a n _ t y p e   p u b l i c . s u b s c r i p t i o n _ p l a n   D E F A U L T   ' S T A R T E R '  
 )  
 R E T U R N S   U U I D  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 D E C L A R E  
         c u r r e n t _ u i d   U U I D ;  
         u s e r _ r e c o r d _ i d   U U I D ;  
         n e w _ o r g _ i d   U U I D ;  
         g e n e r a t e d _ s l u g   T E X T ;  
         b a s e _ s l u g   T E X T ;  
         s l u g _ e x i s t s   B O O L E A N ;  
         s l u g _ s u f f i x   I N T   : =   0 ;  
 B E G I N  
         - -   1 .   G e t   C u r r e n t   U s e r   I D   f r o m   A u t h  
         c u r r e n t _ u i d   : =   a u t h . u i d ( ) ;  
          
         I F   c u r r e n t _ u i d   I S   N U L L   T H E N  
                 R A I S E   E X C E P T I O N   ' N o t   a u t h e n t i c a t e d ' ;  
         E N D   I F ;  
  
         - -   2 .   V a l i d a t e   U s e r   E x i s t s   i n   P u b l i c   T a b l e  
         S E L E C T   i d   I N T O   u s e r _ r e c o r d _ i d  
         F R O M   p u b l i c . u s e r s  
         W H E R E   a u t h _ i d   =   c u r r e n t _ u i d ;  
  
         I F   u s e r _ r e c o r d _ i d   I S   N U L L   T H E N  
                 R A I S E   E X C E P T I O N   ' U s e r   p r o f i l e   n o t   f o u n d .   C o m p l e t e   s i g n   u p   f i r s t . ' ;  
         E N D   I F ;  
  
         - -   3 .   C h e c k   i f   u s e r   a l r e a d y   h a s   a n   o r g a n i z a t i o n   ( O p t i o n a l :   E n f o r c e   1   o r g   p e r   o w n e r   f o r   M V P )  
         - -   U n c o m m e n t   i f   s t r i c t   1 - o r g   l i m i t   i s   d e s i r e d  
         - -   I F   E X I S T S   ( S E L E C T   1   F R O M   o r g a n i z a t i o n _ m e m b e r s   W H E R E   u s e r _ i d   =   u s e r _ r e c o r d _ i d   A N D   r o l e   =   ' O W N E R ' )   T H E N  
         - -         R A I S E   E X C E P T I O N   ' U s e r   a l r e a d y   o w n s   a n   o r g a n i z a t i o n ' ;  
         - -   E N D   I F ;  
  
         - -   4 .   G e n e r a t e   S l u g  
         - -   C o n v e r t   t o   l o w e r   c a s e ,   r e p l a c e   n o n - a l p h a n u m e r i c   w i t h   h y p h e n ,   r e m o v e   l e a d i n g / t r a i l i n g   h y p h e n s  
         b a s e _ s l u g   : =   l o w e r ( r e g e x p _ r e p l a c e ( t r i m ( o r g _ n a m e ) ,   ' [ ^ a - z A - Z 0 - 9 ] + ' ,   ' - ' ,   ' g ' ) ) ;  
         - -   R e m o v e   m u l t i - h y p h e n s  
         b a s e _ s l u g   : =   r e g e x p _ r e p l a c e ( b a s e _ s l u g ,   ' - + ' ,   ' - ' ,   ' g ' ) ;  
         - -   S t r i p   s t a r t / e n d   h y p h e n s  
         b a s e _ s l u g   : =   t r i m ( b o t h   ' - '   f r o m   b a s e _ s l u g ) ;  
          
         - -   F a l l b a c k   f o r   e m p t y   s l u g  
         I F   l e n g t h ( b a s e _ s l u g )   <   2   T H E N  
                 b a s e _ s l u g   : =   ' o r g - '   | |   s u b s t r i n g ( m d 5 ( r a n d o m ( ) : : t e x t )   f r o m   1   f o r   6 ) ;  
         E N D   I F ;  
  
         - -   U n i q u e   S l u g   L o g i c  
         g e n e r a t e d _ s l u g   : =   b a s e _ s l u g ;  
         L O O P  
                 S E L E C T   E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . o r g a n i z a t i o n s   W H E R E   s l u g   =   g e n e r a t e d _ s l u g )  
                 I N T O   s l u g _ e x i s t s ;  
                  
                 E X I T   W H E N   N O T   s l u g _ e x i s t s ;  
                  
                 s l u g _ s u f f i x   : =   s l u g _ s u f f i x   +   1 ;  
                 g e n e r a t e d _ s l u g   : =   b a s e _ s l u g   | |   ' - '   | |   s l u g _ s u f f i x ;  
         E N D   L O O P ;  
  
         - -   5 .   C r e a t e   O r g a n i z a t i o n  
         I N S E R T   I N T O   p u b l i c . o r g a n i z a t i o n s   (  
                 n a m e ,  
                 s l u g ,  
                 p l a n ,  
                 i s _ a c t i v e ,  
                 c r e a t e d _ a t ,  
                 u p d a t e d _ a t  
         )   V A L U E S   (  
                 o r g _ n a m e ,  
                 g e n e r a t e d _ s l u g ,  
                 p l a n _ t y p e ,  
                 T R U E ,  
                 N O W ( ) ,  
                 N O W ( )  
         )   R E T U R N I N G   i d   I N T O   n e w _ o r g _ i d ;  
  
         - -   6 .   A s s i g n   O w n e r   R o l e  
         I N S E R T   I N T O   p u b l i c . o r g a n i z a t i o n _ m e m b e r s   (  
                 u s e r _ i d ,  
                 o r g a n i z a t i o n _ i d ,  
                 r o l e ,  
                 j o i n e d _ a t  
         )   V A L U E S   (  
                 u s e r _ r e c o r d _ i d ,  
                 n e w _ o r g _ i d ,  
                 ' O W N E R ' ,  
                 N O W ( )  
         ) ;  
  
         - -   7 .   U p d a t e   U s e r ' s   C u r r e n t   C o n t e x t  
         U P D A T E   p u b l i c . u s e r s  
         S E T   c u r r e n t _ o r g a n i z a t i o n _ i d   =   n e w _ o r g _ i d ,  
                 u p d a t e d _ a t   =   N O W ( )  
         W H E R E   i d   =   u s e r _ r e c o r d _ i d ;  
  
         R E T U R N   n e w _ o r g _ i d ;  
 E N D ;  
 $ $ ;  
  
 C O M M E N T   O N   F U N C T I O N   p u b l i c . i n i t i a l i z e _ o w n e r _ o r g a n i z a t i o n   I S   ' C r e a t e s   a   n e w   o r g a n i z a t i o n   a n d   a s s i g n s   t h e   c u r r e n t   a u t h e n t i c a t e d   u s e r   a s   i t s   O W N E R . ' ;  
 -- ==============================================================================
-- Function: get_dashboard_stats
-- Description: Returns summary statistics for the dashboard in a single query.
--              PENDING: Assigned to user && Status != CLOSED
--              CRITICAL: Assigned to user && Status != CLOSED && Priority == CRITICAL
-- Security: SECURITY DEFINER (Runs as creator), but uses auth.uid() for filtering.
--           This ensures we only count user's OWN assigned items.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    pending_count INT;
    critical_count INT;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Resolve Public User ID
    SELECT id INTO user_record_id
    FROM public.users
    WHERE auth_id = current_uid;

    IF user_record_id IS NULL THEN
         RETURN json_build_object('pending', 0, 'critical', 0);
    END IF;

    -- 3. Calculate Pending (Assigned to me, not Closed)
    SELECT COUNT(*) INTO pending_count
    FROM public.incidents
    WHERE assigned_to = user_record_id
    AND status != 'CLOSED';

    -- 4. Calculate Critical (Assigned to me, Critical, not Closed)
    SELECT COUNT(*) INTO critical_count
    FROM public.incidents
    WHERE assigned_to = user_record_id
    AND status != 'CLOSED'
    AND priority = 'CRITICAL';

    -- 5. Return JSON
    RETURN json_build_object(
        'pending', pending_count,
        'critical', critical_count
    );
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats IS 'Returns pending and critical incident counts for the authenticated user.';

-- ==============================================================================
-- Function: get_my_projects
-- Description: Returns list of projects user is a member of, with computed counts.
--              Includes: member_count, open_incidents_count
-- Security: SECURITY DEFINER + explicit membership check.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_my_projects()
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    name TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    status public.project_status,
    owner_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    member_count BIGINT,
    open_incidents_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Resolve Public User ID
    SELECT u.id INTO user_record_id
    FROM public.users u
    WHERE u.auth_id = current_uid;

    IF user_record_id IS NULL THEN
         RETURN; -- Return empty set
    END IF;

    -- 3. Return Projects with Counts
    RETURN QUERY
    SELECT 
        p.id,
        p.organization_id,
        p.name::text,
        p.location::text,
        p.start_date,
        p.end_date,
        p.status,
        p.owner_id,
        p.created_at,
        p.updated_at,
        (
            SELECT COUNT(*)::BIGINT 
            FROM public.project_members pm_count 
            WHERE pm_count.project_id = p.id
        ) as member_count,
        (
            SELECT COUNT(*)::BIGINT 
            FROM public.incidents i_count 
            WHERE i_count.project_id = p.id 
            AND i_count.status != 'CLOSED'
        ) as open_incidents_count
    FROM public.projects p
    INNER JOIN public.project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = user_record_id
    ORDER BY p.created_at DESC;

END;
$$;

COMMENT ON FUNCTION public.get_my_projects IS 'Returns projects the user belongs to with member and incident counts.';
-- ==============================================================================
-- Function: initialize_owner_organization
-- Description: Creates a new organization, makes the current user the OWNER, 
--              and sets it as their current context.
-- Security: SECURITY DEFINER (Runs with privileges of the creator to bypass RLS 
--           during initial setup if needed, though RLS should allow INSERTs for auth'd users)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.initialize_owner_organization(
    org_name TEXT,
    plan_type public.subscription_plan DEFAULT 'STARTER'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    new_org_id UUID;
    generated_slug TEXT;
    base_slug TEXT;
    slug_exists BOOLEAN;
    slug_suffix INT := 0;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate User Exists in Public Table
    SELECT id INTO user_record_id
    FROM public.users
    WHERE auth_id = current_uid;

    IF user_record_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found. Complete sign up first.';
    END IF;

    -- 3. Check if user already has an organization (Optional: Enforce 1 org per owner for MVP)
    -- Uncomment if strict 1-org limit is desired
    -- IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = user_record_id AND role = 'OWNER') THEN
    --    RAISE EXCEPTION 'User already owns an organization';
    -- END IF;

    -- 4. Generate Slug
    -- Convert to lower case, replace non-alphanumeric with hyphen, remove leading/trailing hyphens
    base_slug := lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove multi-hyphens
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    -- Strip start/end hyphens
    base_slug := trim(both '-' from base_slug);
    
    -- Fallback for empty slug
    IF length(base_slug) < 2 THEN
        base_slug := 'org-' || substring(md5(random()::text) from 1 for 6);
    END IF;

    -- Unique Slug Logic
    generated_slug := base_slug;
    LOOP
        SELECT EXISTS (SELECT 1 FROM public.organizations WHERE slug = generated_slug)
        INTO slug_exists;
        
        EXIT WHEN NOT slug_exists;
        
        slug_suffix := slug_suffix + 1;
        generated_slug := base_slug || '-' || slug_suffix;
    END LOOP;

    -- 5. Create Organization
    INSERT INTO public.organizations (
        name,
        slug,
        plan,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        org_name,
        generated_slug,
        plan_type,
        TRUE,
        NOW(),
        NOW()
    ) RETURNING id INTO new_org_id;

    -- 6. Assign Owner Role
    INSERT INTO public.organization_members (
        user_id,
        organization_id,
        role,
        joined_at
    ) VALUES (
        user_record_id,
        new_org_id,
        'OWNER',
        NOW()
    );

    -- 7. Update User's Current Context
    UPDATE public.users
    SET current_organization_id = new_org_id,
        updated_at = NOW()
    WHERE id = user_record_id;

    RETURN new_org_id;
END;
$$;

COMMENT ON FUNCTION public.initialize_owner_organization IS 'Creates a new organization and assigns the current authenticated user as its OWNER.';
