// Supabase Database 타입 정의
// db-model 스킬이 테이블 생성 시 이 파일을 자동으로 업데이트합니다.

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
