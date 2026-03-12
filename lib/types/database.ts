// Supabase Database 타입 정의
// db-model 스킬이 테이블 생성 시 이 파일을 자동으로 업데이트합니다.

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          auth_provider: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          subscription_balance: number;
          onetime_balance: number;
          last_generation_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          subscription_balance?: number;
          onetime_balance?: number;
          last_generation_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          subscription_balance?: number;
          onetime_balance?: number;
          last_generation_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          price_usd: number;
          monthly_credits: number;
          max_batch_size: number;
          cooldown_seconds: number;
          retention_days: number | null;
          features: Record<string, boolean>;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          price_usd?: number;
          monthly_credits?: number;
          max_batch_size?: number;
          cooldown_seconds?: number;
          retention_days?: number | null;
          features?: Record<string, boolean>;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price_usd?: number;
          monthly_credits?: number;
          max_batch_size?: number;
          cooldown_seconds?: number;
          retention_days?: number | null;
          features?: Record<string, boolean>;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string | null;
          external_subscription_id: string | null;
          external_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string | null;
          external_subscription_id?: string | null;
          external_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string | null;
          external_subscription_id?: string | null;
          external_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_history: {
        Row: {
          id: string;
          user_id: string;
          feature_type: string;
          model_id: string;
          prompt: string;
          input_urls: string[];
          thumb_urls: string[];
          display_urls: string[];
          original_urls: string[];
          credits_used: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature_type?: string;
          model_id: string;
          prompt: string;
          input_urls?: string[];
          thumb_urls?: string[];
          display_urls?: string[];
          original_urls?: string[];
          credits_used?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feature_type?: string;
          model_id?: string;
          prompt?: string;
          input_urls?: string[];
          thumb_urls?: string[];
          display_urls?: string[];
          original_urls?: string[];
          credits_used?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generation_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          onetime_delta: number;
          subscription_delta: number;
          balance_after_onetime: number;
          balance_after_subscription: number;
          description: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          onetime_delta?: number;
          subscription_delta?: number;
          balance_after_onetime?: number;
          balance_after_subscription?: number;
          description?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          onetime_delta?: number;
          subscription_delta?: number;
          balance_after_onetime?: number;
          balance_after_subscription?: number;
          description?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description?: string;
          p_metadata?: Record<string, unknown>;
        };
        Returns: Record<string, unknown>;
      };
      add_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_credit_type: string;
          p_transaction_type: string;
          p_description?: string;
          p_metadata?: Record<string, unknown>;
        };
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      credit_transaction_type:
        | "signup_bonus"
        | "subscription_grant"
        | "onetime_purchase"
        | "generation_deduct"
        | "refund"
        | "admin_adjust";
    };
  };
}
