export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// --------------------------------------------------
// Enums (mirror PostgreSQL custom types)
// --------------------------------------------------

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'ai_verifying'
  | 'ai_verified'
  | 'ai_rejected'
  | 'pending_mrv_review'
  | 'verified'
  | 'rejected'
  | 'credit_eligible'
  | 'credit_issued'

export type EcosystemType = 'mangrove' | 'seagrass' | 'salt_marsh'

export type LocationSource = 'gps_auto' | 'manual'

// --------------------------------------------------
// Database type definition
// --------------------------------------------------

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      // ------------------------------------------------
      // profiles — user display name, linked to auth.users
      // ------------------------------------------------
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------
      // ecosystem_parameters — versioned carbon calc inputs
      // Values are ESTIMATES based on published literature.
      // ------------------------------------------------
      ecosystem_parameters: {
        Row: {
          id: string
          ecosystem_type: EcosystemType
          biomass_density_t_per_ha: number
          carbon_fraction: number
          co2_conversion_factor: number
          version: string
          is_active: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ecosystem_type: EcosystemType
          biomass_density_t_per_ha: number
          carbon_fraction: number
          co2_conversion_factor: number
          version?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ecosystem_type?: EcosystemType
          biomass_density_t_per_ha?: number
          carbon_fraction?: number
          co2_conversion_factor?: number
          version?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------
      // monitoring_reports — core field monitoring records
      // ------------------------------------------------
      monitoring_reports: {
        Row: {
          id: string
          user_id: string
          status: ReportStatus
          latitude: number | null
          longitude: number | null
          location_source: LocationSource | null
          gps_accuracy_m: number | null
          ecosystem_type: EcosystemType | null
          area_hectares: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: ReportStatus
          latitude?: number | null
          longitude?: number | null
          location_source?: LocationSource | null
          gps_accuracy_m?: number | null
          ecosystem_type?: EcosystemType | null
          area_hectares?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: ReportStatus
          latitude?: number | null
          longitude?: number | null
          location_source?: LocationSource | null
          gps_accuracy_m?: number | null
          ecosystem_type?: EcosystemType | null
          area_hectares?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ------------------------------------------------
      // report_images — uploaded images per report
      // ------------------------------------------------
      report_images: {
        Row: {
          id: string
          report_id: string
          user_id: string
          storage_path: string
          file_name: string
          file_size_bytes: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          storage_path: string
          file_name: string
          file_size_bytes: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          storage_path?: string
          file_name?: string
          file_size_bytes?: number
          mime_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monitoring_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ------------------------------------------------
      // ai_verifications — Gemini Vision classification results
      // WRITE PROTECTED: only service_role (Edge Function) can insert.
      // Prevents client from fabricating verification results.
      // ------------------------------------------------
      ai_verifications: {
        Row: {
          id: string
          image_id: string
          report_id: string
          is_valid_blue_carbon_ecosystem: boolean
          ecosystem_type: string       // 'mangrove' | 'seagrass' | 'salt_marsh' | 'invalid'
          detected_subject: string
          confidence: number           // 0.00–100.00
          reason: string
          raw_response: Json | null
          model_version: string
          created_at: string
        }
        Insert: {
          id?: string
          image_id: string
          report_id: string
          is_valid_blue_carbon_ecosystem: boolean
          ecosystem_type: string
          detected_subject: string
          confidence: number
          reason: string
          raw_response?: Json | null
          model_version?: string
          created_at?: string
        }
        Update: {
          id?: string
          image_id?: string
          report_id?: string
          is_valid_blue_carbon_ecosystem?: boolean
          ecosystem_type?: string
          detected_subject?: string
          confidence?: number
          reason?: string
          raw_response?: Json | null
          model_version?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_verifications_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "report_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_verifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monitoring_reports"
            referencedColumns: ["id"]
          }
        ]
      }

      // ------------------------------------------------
      // carbon_assessments — deterministic carbon estimates
      // WRITE PROTECTED: only service_role (Edge Function) can insert.
      // These are ESTIMATES, not verified scientific measurements.
      // ------------------------------------------------
      carbon_assessments: {
        Row: {
          id: string
          report_id: string
          ecosystem_type: EcosystemType
          area_hectares: number
          biomass_density_t_per_ha: number
          carbon_fraction: number
          co2_conversion_factor: number
          estimated_co2e_tons: number
          potential_credits: number
          estimated_value_usd: number
          parameter_version: string
          calculation_method: string
          status: string               // 'estimated' | 'verified'
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          ecosystem_type: EcosystemType
          area_hectares: number
          biomass_density_t_per_ha: number
          carbon_fraction: number
          co2_conversion_factor: number
          estimated_co2e_tons: number
          potential_credits: number
          estimated_value_usd: number
          parameter_version?: string
          calculation_method?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          ecosystem_type?: EcosystemType
          area_hectares?: number
          biomass_density_t_per_ha?: number
          carbon_fraction?: number
          co2_conversion_factor?: number
          estimated_co2e_tons?: number
          potential_credits?: number
          estimated_value_usd?: number
          parameter_version?: string
          calculation_method?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carbon_assessments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "monitoring_reports"
            referencedColumns: ["id"]
          }
        ]
      }

      // ------------------------------------------------
      // mrv_reviews — human authorised review records
      // Normal users cannot approve their own reports.
      // ------------------------------------------------
      mrv_reviews: {
        Row: {
          id: string
          report_id: string
          reviewer_id: string | null
          status: string               // 'pending' | 'approved' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          reviewer_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          reviewer_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrv_reviews_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monitoring_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrv_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ------------------------------------------------
      // carbon_credits — credit eligibility and issuance
      // Blockchain integration is PLANNED (not yet live).
      // Do not claim real blockchain verification for MVP.
      // ------------------------------------------------
      carbon_credits: {
        Row: {
          id: string
          report_id: string
          assessment_id: string
          status: string               // 'eligible' | 'issued' | 'revoked'
          credit_amount: number
          verification_hash: string | null
          blockchain_status: string    // 'prototype_audit_record' for MVP
          blockchain_tx_hash: string | null
          blockchain_network: string | null
          issued_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          assessment_id: string
          status?: string
          credit_amount: number
          verification_hash?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          blockchain_network?: string | null
          issued_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          assessment_id?: string
          status?: string
          credit_amount?: number
          verification_hash?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          blockchain_network?: string | null
          issued_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carbon_credits_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monitoring_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carbon_credits_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "carbon_assessments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      report_status: ReportStatus
      ecosystem_type: EcosystemType
      location_source: LocationSource
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
      report_status: [
        'draft', 'submitted', 'ai_verifying', 'ai_verified',
        'ai_rejected', 'pending_mrv_review', 'verified',
        'rejected', 'credit_eligible', 'credit_issued'
      ] as const,
      ecosystem_type: ['mangrove', 'seagrass', 'salt_marsh'] as const,
      location_source: ['gps_auto', 'manual'] as const,
    },
  },
} as const
