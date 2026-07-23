export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aeo_links: {
        Row: {
          child_id: string
          parent_id: string
          tenant_id: string
          weight: number
        }
        Insert: {
          child_id: string
          parent_id: string
          tenant_id: string
          weight?: number
        }
        Update: {
          child_id?: string
          parent_id?: string
          tenant_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "aeo_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "aeos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aeo_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "aeos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aeo_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      aeos: {
        Row: {
          agent_id: string | null
          description: string | null
          hash: string | null
          id: string
          label: string
          parent_hash: string | null
          payload: Json
          session_id: string | null
          severity: Database["public"]["Enums"]["aeo_severity"] | null
          sig: Json | null
          tenant_id: string
          ts: string
          type: Database["public"]["Enums"]["aeo_type"]
          val: number
          verdict: string | null
        }
        Insert: {
          agent_id?: string | null
          description?: string | null
          hash?: string | null
          id: string
          label: string
          parent_hash?: string | null
          payload?: Json
          session_id?: string | null
          severity?: Database["public"]["Enums"]["aeo_severity"] | null
          sig?: Json | null
          tenant_id: string
          ts?: string
          type: Database["public"]["Enums"]["aeo_type"]
          val?: number
          verdict?: string | null
        }
        Update: {
          agent_id?: string | null
          description?: string | null
          hash?: string | null
          id?: string
          label?: string
          parent_hash?: string | null
          payload?: Json
          session_id?: string | null
          severity?: Database["public"]["Enums"]["aeo_severity"] | null
          sig?: Json | null
          tenant_id?: string
          ts?: string
          type?: Database["public"]["Enums"]["aeo_type"]
          val?: number
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aeos_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aeos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aeos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          capabilities: Json
          class: string
          created_at: string
          did: string
          display_name: string
          id: string
          last_seen_at: string | null
          tenant_id: string
          trust_score: number
        }
        Insert: {
          capabilities?: Json
          class: string
          created_at?: string
          did: string
          display_name: string
          id?: string
          last_seen_at?: string | null
          tenant_id: string
          trust_score?: number
        }
        Update: {
          capabilities?: Json
          class?: string
          created_at?: string
          did?: string
          display_name?: string
          id?: string
          last_seen_at?: string | null
          tenant_id?: string
          trust_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          code: string
          description: string | null
          framework: string
          id: string
          title: string
        }
        Insert: {
          code: string
          description?: string | null
          framework: string
          id: string
          title: string
        }
        Update: {
          code?: string
          description?: string | null
          framework?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      findings: {
        Row: {
          adjudicated_at: string | null
          adjudicated_by: string | null
          aeo_id: string
          created_at: string
          id: string
          impact_usd: number | null
          label: string
          remediation_usd: number | null
          roi_text: string | null
          severity: Database["public"]["Enums"]["aeo_severity"]
          status: Database["public"]["Enums"]["finding_status"]
          tenant_id: string
        }
        Insert: {
          adjudicated_at?: string | null
          adjudicated_by?: string | null
          aeo_id: string
          created_at?: string
          id?: string
          impact_usd?: number | null
          label: string
          remediation_usd?: number | null
          roi_text?: string | null
          severity: Database["public"]["Enums"]["aeo_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          tenant_id: string
        }
        Update: {
          adjudicated_at?: string | null
          adjudicated_by?: string | null
          aeo_id?: string
          created_at?: string
          id?: string
          impact_usd?: number | null
          label?: string
          remediation_usd?: number | null
          roi_text?: string | null
          severity?: Database["public"]["Enums"]["aeo_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_aeo_id_fkey"
            columns: ["aeo_id"]
            isOneToOne: false
            referencedRelation: "aeos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rulepacks: {
        Row: {
          active: boolean
          created_at: string
          generation: number
          id: string
          metrics: Json
          parent_id: string | null
          tenant_id: string
          weights: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          generation: number
          id?: string
          metrics?: Json
          parent_id?: string | null
          tenant_id: string
          weights?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          generation?: number
          id?: string
          metrics?: Json
          parent_id?: string | null
          tenant_id?: string
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rulepacks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "rulepacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rulepacks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          agent_id: string | null
          ended_at: string | null
          id: string
          intent: Json
          session_ref: string
          started_at: string
          tenant_id: string
        }
        Insert: {
          agent_id?: string | null
          ended_at?: string | null
          id?: string
          intent?: Json
          session_ref: string
          started_at?: string
          tenant_id: string
        }
        Update: {
          agent_id?: string | null
          ended_at?: string | null
          id?: string
          intent?: Json
          session_ref?: string
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          classification: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          classification?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          classification?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant: string
          _user: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      aeo_severity: "CAT_I" | "CAT_II" | "CAT_III"
      aeo_type:
        | "prompt"
        | "tool"
        | "finding"
        | "control"
        | "attest"
        | "rulepack"
        | "replay"
      app_role: "admin" | "operator" | "auditor"
      finding_status: "open" | "adjudicated" | "dismissed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aeo_severity: ["CAT_I", "CAT_II", "CAT_III"],
      aeo_type: [
        "prompt",
        "tool",
        "finding",
        "control",
        "attest",
        "rulepack",
        "replay",
      ],
      app_role: ["admin", "operator", "auditor"],
      finding_status: ["open", "adjudicated", "dismissed"],
    },
  },
} as const
