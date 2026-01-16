/**
 * Tipos generados automáticamente desde el esquema de Supabase
 * Proyecto: strop (splypnvbvqyqotnlxxii)
 * Generado: 2026-01-12
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_day_closures: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closure_date: string
          id: string
          official_content: string
          organization_id: string
          pin_hash: string | null
          project_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closure_date: string
          id?: string
          official_content: string
          organization_id: string
          pin_hash?: string | null
          project_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closure_date?: string
          id?: string
          official_content?: string
          organization_id?: string
          pin_hash?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_day_closures_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_day_closures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_day_closures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_entries: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          incident_id: string | null
          is_locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          organization_id: string
          project_id: string
          source: Database["public"]["Enums"]["event_source"] | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          incident_id?: string | null
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          organization_id: string
          project_id: string
          source?: Database["public"]["Enums"]["event_source"] | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          incident_id?: string | null
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          organization_id?: string
          project_id?: string
          source?: Database["public"]["Enums"]["event_source"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_entries_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_entries_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string
          incident_id: string
          organization_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          incident_id: string
          organization_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          incident_id?: string
          organization_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          closed_by: string | null
          closed_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          location: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["incident_priority"] | null
          project_id: string
          status: Database["public"]["Enums"]["incident_status"] | null
          title: string
          type: Database["public"]["Enums"]["incident_type"]
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closed_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          location?: string | null
          organization_id: string
          priority?: Database["public"]["Enums"]["incident_priority"] | null
          project_id: string
          status?: Database["public"]["Enums"]["incident_status"] | null
          title: string
          type: Database["public"]["Enums"]["incident_type"]
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closed_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["incident_priority"] | null
          project_id?: string
          status?: Database["public"]["Enums"]["incident_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["incident_type"]
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_projects: number | null
          max_users: number | null
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          slug: string
          storage_quota_mb: number | null
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_projects?: number | null
          max_users?: number | null
          name: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          slug: string
          storage_quota_mb?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_projects?: number | null
          max_users?: number | null
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          slug?: string
          storage_quota_mb?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          incident_id: string
          organization_id: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          organization_id: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          organization_id?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_role: Database["public"]["Enums"]["project_role"]
          id: string
          organization_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_role: Database["public"]["Enums"]["project_role"]
          id?: string
          organization_id: string
          project_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["project_role"]
          id?: string
          organization_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          location: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          owner_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          location: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          owner_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          location?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          current_organization_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          profile_picture_url: string | null
          theme_mode: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          profile_picture_url?: string | null
          theme_mode?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          profile_picture_url?: string | null
          theme_mode?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_for_new_owner: {
        Args: {
          org_name: string
          org_plan?: Database["public"]["Enums"]["subscription_plan"]
          org_slug: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_bitacora_timeline: {
        Args: {
          p_end_date?: string
          p_project_id: string
          p_source?: Database["public"]["Enums"]["event_source"]
          p_start_date?: string
        }
        Returns: {
          content: string
          created_by: string
          event_date: string
          id: string
          metadata: Json
          project_id: string
          source: Database["public"]["Enums"]["event_source"]
          title: string
        }[]
      }
      switch_organization: { Args: { target_org_id: string }; Returns: boolean }
    }
    Enums: {
      event_source: "INCIDENT" | "MANUAL" | "MOBILE" | "SYSTEM"
      incident_priority: "NORMAL" | "CRITICAL"
      incident_status: "OPEN" | "ASSIGNED" | "CLOSED"
      incident_type:
        | "ORDER_INSTRUCTION"
        | "REQUEST_QUERY"
        | "CERTIFICATION"
        | "INCIDENT_NOTIFICATION"
      project_role: "SUPERINTENDENT" | "RESIDENT" | "CABO"
      project_status: "ACTIVE" | "PAUSED" | "COMPLETED"
      subscription_plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
      user_role: "OWNER" | "SUPERINTENDENT" | "RESIDENT" | "CABO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// Convenient type aliases
export type User = Tables<"users">
export type Organization = Tables<"organizations">
export type OrganizationMember = Tables<"organization_members">
export type Project = Tables<"projects">
export type ProjectMember = Tables<"project_members">
export type Incident = Tables<"incidents">
export type Comment = Tables<"comments">
export type Photo = Tables<"photos">
export type BitacoraEntry = Tables<"bitacora_entries">
export type BitacoraDayClosure = Tables<"bitacora_day_closures">
export type Invitation = Tables<"invitations">
export type AuditLog = Tables<"audit_logs">
export type UserSetting = Tables<"user_settings">

// Enum type aliases
export type UserRole = Enums<"user_role">
export type ProjectRole = Enums<"project_role">
export type ProjectStatus = Enums<"project_status">
export type IncidentType = Enums<"incident_type">
export type IncidentStatus = Enums<"incident_status">
export type IncidentPriority = Enums<"incident_priority">
export type EventSource = Enums<"event_source">
export type SubscriptionPlan = Enums<"subscription_plan">

// Constants for enums
export const USER_ROLES: UserRole[] = ["OWNER", "SUPERINTENDENT", "RESIDENT", "CABO"]
export const PROJECT_ROLES: ProjectRole[] = ["SUPERINTENDENT", "RESIDENT", "CABO"]
export const PROJECT_STATUSES: ProjectStatus[] = ["ACTIVE", "PAUSED", "COMPLETED"]
export const INCIDENT_TYPES: IncidentType[] = [
  "ORDER_INSTRUCTION",
  "REQUEST_QUERY",
  "CERTIFICATION",
  "INCIDENT_NOTIFICATION",
]
export const INCIDENT_STATUSES: IncidentStatus[] = ["OPEN", "ASSIGNED", "CLOSED"]
export const INCIDENT_PRIORITIES: IncidentPriority[] = ["NORMAL", "CRITICAL"]
export const EVENT_SOURCES: EventSource[] = ["INCIDENT", "MANUAL", "MOBILE", "SYSTEM"]
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"]
