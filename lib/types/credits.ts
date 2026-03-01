export type PlanId = "free" | "basic" | "deluxe" | "premium";

export interface CreditBalance {
  total: number;
  subscription: number;
  onetime: number;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceUsd: number;
  monthlyCredits: number;
  maxBatchSize: number;
  cooldownSeconds: number;
  features: Record<string, boolean>;
}

export interface UserCreditInfo {
  balance: CreditBalance;
  plan: PlanInfo;
  lastGenerationAt: string | null;
}

export interface DeductResult {
  success: boolean;
  error?: string;
  onetimeBalance?: number;
  subscriptionBalance?: number;
  totalBalance?: number;
  onetimeDeducted?: number;
  subscriptionDeducted?: number;
  available?: number;
  required?: number;
}
