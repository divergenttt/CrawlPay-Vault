export interface Payment {
  id: string;
  bot_name: string;
  user_agent: string;
  page_url: string;
  amount_usdc: number;
  tx_hash: string;
  created_at: string;
}

export type ChartDay = {
  label: string;
  revenue: number;
};

export interface PaymentsPage {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardStats {
  total_earned: number;
  total_requests: number;
  unique_bots: number;
  today_earned: number;
}

export interface GatewayBalance {
  wallet: string;
  total: string;
  available: string;
  withdrawing: string;
  error?: string;
}
