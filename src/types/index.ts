export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string | null;
}

export interface AgentService {
  id: string; // e.g. "openai_gpt4"
  providerAddress: string;
  name: string;
  description: string;
  price: number; // in micro-units/cents (e.g. 50 = $0.50)
  tokenAddress: string; // e.g. USDC token contract
  category: "LLM" | "Translation" | "ImageGen" | "Analysis" | "Audio";
}

export type EscrowStatus = "pending" | "completed" | "refunded" | "expired";

export interface EscrowRequest {
  id: string; // request_id on chain
  clientAddress: string;
  providerAddress: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  tokenSymbol: string;
  timeout: number; // unix timestamp
  status: EscrowStatus;
  requestHash: string;
  resultHash: string | null;
  timestamp: number; // unix timestamp
  txHash: string;
}

export interface AgentNode {
  id: string;
  name: string;
  type: "client" | "provider";
  avatar: string;
  status: "idle" | "working" | "waiting";
}

export interface AgentLink {
  source: string;
  target: string;
  amount: number;
  status: "pending" | "completed";
}
