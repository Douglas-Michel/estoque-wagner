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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      inventory_items: {
        Row: {
          acabamento: string | null
          altura: number | null
          codigo: string
          created_at: string | null
          espessura: number | null
          id: string
          largura: number | null
          lote_id: string | null
          nome: string | null
          observacao_avaria: string | null
          observacao_disponivel: string | null
          observacao_reservado: string | null
          observacoes: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          polegada: number | null
          position_column: string
          position_floor: number
          quantidade: number
          quantidade_avaria: number
          quantidade_disponivel: number
          quantidade_reservada: number
          status: string
          tempera: string | null
          tipo: string
          updated_at: string | null
          usina: string | null
        }
        Insert: {
          acabamento?: string | null
          altura?: number | null
          codigo: string
          created_at?: string | null
          espessura?: number | null
          id?: string
          largura?: number | null
          lote_id?: string | null
          nome?: string | null
          observacao_avaria?: string | null
          observacao_disponivel?: string | null
          observacao_reservado?: string | null
          observacoes?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          polegada?: number | null
          position_column: string
          position_floor: number
          quantidade: number
          quantidade_avaria?: number
          quantidade_disponivel?: number
          quantidade_reservada?: number
          status?: string
          tempera?: string | null
          tipo: string
          updated_at?: string | null
          usina?: string | null
        }
        Update: {
          acabamento?: string | null
          altura?: number | null
          codigo?: string
          created_at?: string | null
          espessura?: number | null
          id?: string
          largura?: number | null
          lote_id?: string | null
          nome?: string | null
          observacao_avaria?: string | null
          observacao_disponivel?: string | null
          observacao_reservado?: string | null
          observacoes?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          polegada?: number | null
          position_column?: string
          position_floor?: number
          quantidade?: number
          quantidade_avaria?: number
          quantidade_disponivel?: number
          quantidade_reservada?: number
          status?: string
          tempera?: string | null
          tipo?: string
          updated_at?: string | null
          usina?: string | null
        }
        Relationships: []
      }
      ordens_saida: {
        Row: {
          created_at: string | null
          data_emissao: string
          id: string
          numero_ordem: string
          observacoes: string | null
          status: Database["public"]["Enums"]["ordem_status"]
          updated_at: string | null
          usuario_email: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string
          id?: string
          numero_ordem: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: []
      }
      ordens_saida_itens: {
        Row: {
          codigo: string
          created_at: string | null
          empresa: string | null
          id: string
          item_id: string
          observacoes: string | null
          ordem_id: string
          position_column: string
          position_floor: number
          quantidade: number
          tipo: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          empresa?: string | null
          id?: string
          item_id: string
          observacoes?: string | null
          ordem_id: string
          position_column: string
          position_floor: number
          quantidade: number
          tipo: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          empresa?: string | null
          id?: string
          item_id?: string
          observacoes?: string | null
          ordem_id?: string
          position_column?: string
          position_floor?: number
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_saida_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_saida_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_saida"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      report_logs: {
        Row: {
          id: string
          report_type: string
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          id?: string
          report_type: string
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          id?: string
          report_type?: string
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string | null
          observacoes: string | null
          position_column: string
          position_floor: number
          quantidade: number
          timestamp: string | null
          tipo: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          observacoes?: string | null
          position_column: string
          position_floor: number
          quantidade: number
          timestamp?: string | null
          tipo: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
          observacoes?: string | null
          position_column?: string
          position_floor?: number
          quantidade?: number
          timestamp?: string | null
          tipo?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tower_config: {
        Row: {
          column_name: string
          created_at: string | null
          floors: number[]
          id: string
          updated_at: string | null
        }
        Insert: {
          column_name: string
          created_at?: string | null
          floors?: number[]
          id?: string
          updated_at?: string | null
        }
        Update: {
          column_name?: string
          created_at?: string | null
          floors?: number[]
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_numero_ordem: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      ordem_status:
        | "em_separacao"
        | "concluida"
        | "cancelada"
        | "aguardando_envio"
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
      app_role: ["admin", "user"],
      ordem_status: [
        "em_separacao",
        "concluida",
        "cancelada",
        "aguardando_envio",
      ],
    },
  },
} as const
