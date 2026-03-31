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
          polar_customer_id: string | null;
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
          polar_customer_id?: string | null;
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
          polar_customer_id?: string | null;
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
          period_credits_granted: number;
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
          period_credits_granted?: number;
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
          period_credits_granted?: number;
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
          scheduled_plan_id: string | null;
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
          scheduled_plan_id?: string | null;
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
          scheduled_plan_id?: string | null;
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
          status: string;
          error_message: string | null;
          onetime_deducted: number;
          subscription_deducted: number;
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
          status?: string;
          error_message?: string | null;
          onetime_deducted?: number;
          subscription_deducted?: number;
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
          status?: string;
          error_message?: string | null;
          onetime_deducted?: number;
          subscription_deducted?: number;
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
      favorites: {
        Row: {
          id: string;
          user_id: string;
          feature_type: string;
          name: string;
          prompt: string;
          reference_image_urls: string[];
          model_id: string;
          ratio: string;
          image_size: string;
          scale: number;
          image_count: number;
          sort_order: number;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature_type?: string;
          name: string;
          prompt: string;
          reference_image_urls?: string[];
          model_id: string;
          ratio?: string;
          image_size?: string;
          scale?: number;
          image_count?: number;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feature_type?: string;
          name?: string;
          prompt?: string;
          reference_image_urls?: string[];
          model_id?: string;
          ratio?: string;
          image_size?: string;
          scale?: number;
          image_count?: number;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
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
      webhook_events: {
        Row: {
          id: string;
          event_type: string;
          payload: Record<string, unknown>;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          payload?: Record<string, unknown>;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          payload?: Record<string, unknown>;
          processed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          polar_product_id: string;
          product_type: string;
          amount_cents: number;
          credits_granted: number;
          status: string;
          polar_subscription_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          polar_product_id: string;
          product_type: string;
          amount_cents?: number;
          credits_granted?: number;
          status?: string;
          polar_subscription_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          polar_product_id?: string;
          product_type?: string;
          amount_cents?: number;
          credits_granted?: number;
          status?: string;
          polar_subscription_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
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
      process_subscription_activation: {
        Args: {
          p_user_id: string;
          p_plan_id: string;
          p_polar_subscription_id: string;
          p_polar_customer_id: string;
          p_period_start: string;
          p_period_end: string;
          p_credits: number;
          p_order_id?: string;
          p_amount_cents?: number;
          p_polar_product_id?: string;
          p_old_plan_credits?: number | null;
        };
        Returns: Record<string, unknown>;
      };
      process_credit_purchase: {
        Args: {
          p_user_id: string;
          p_credits: number;
          p_order_id: string;
          p_amount_cents: number;
          p_polar_product_id: string;
          p_polar_customer_id?: string;
        };
        Returns: Record<string, unknown>;
      };
      process_refund: {
        Args: {
          p_user_id: string;
          p_order_id: string;
          p_credits_to_revoke: number;
          p_refund_type?: string;
        };
        Returns: Record<string, unknown>;
      };
      process_subscription_revoke: {
        Args: {
          p_user_id: string;
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
        | "admin_adjust"
        | "subscription_renewal";
    };
  };
}
