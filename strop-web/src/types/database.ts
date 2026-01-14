// Database types aligned with Supabase schema (supabase-strop-schema.sql)

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'OWNER' | 'SUPERINTENDENT' | 'RESIDENT' | 'CABO';

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type IncidentType = 'ORDER_INSTRUCTION' | 'REQUEST_QUERY' | 'CERTIFICATION' | 'INCIDENT_NOTIFICATION';

export type IncidentPriority = 'NORMAL' | 'CRITICAL';

export type EventSource = 'INCIDENT' | 'MANUAL' | 'MOBILE' | 'SYSTEM';

export type IncidentStatus = 'OPEN' | 'ASSIGNED' | 'CLOSED';

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string;
  is_active: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProjectStatus;
  start_date: string | null;
  expected_end_date: string | null;
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  assigned_at: string;
  assigned_by: string | null;
}

// ============================================================================
// INCIDENTS
// ============================================================================

export interface Incident {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  location: string | null;
  created_by: string | null;
  assigned_to: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_notes: string | null;
  created_at: string;
}

export interface IncidentPhoto {
  id: string;
  incident_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
}

// ============================================================================
// BITÁCORA (OPERATIONAL LOG)
// ============================================================================

export interface BitacoraEntry {
  id: string;
  organization_id: string;
  project_id: string;
  source: EventSource;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  incident_id: string | null;
  created_by: string | null;
  created_at: string;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
}

export interface BitacoraDayClosure {
  id: string;
  organization_id: string;
  project_id: string;
  closure_date: string;
  official_content: string;
  pin_hash: string | null;
  closed_by: string | null;
  closed_at: string;
}

// ============================================================================
// INVITATIONS & AUDIT
// ============================================================================

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// EXTENDED TYPES (with relations)
// ============================================================================

export interface UserWithOrganization extends User {
  organization: Organization;
}

export interface ProjectWithMembers extends Project {
  members: (ProjectMember & { user: User })[];
  created_by_user?: User;
}

export interface IncidentWithDetails extends Incident {
  project_name?: string;
  reported_by_name?: string;
  assigned_to_name?: string | null;
}

export interface BitacoraEntryWithUser extends BitacoraEntry {
  created_by_user?: User;
}

// ============================================================================
// NAVIGATION & UI TYPES
// ============================================================================

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  badge?: string | number;
  items?: NavItem[];
}

export interface BreadcrumbItem {
  title: string;
  url?: string;
}
