import { create } from "zustand";
import { WalletState, EscrowRequest, AgentNode, AgentLink } from "@/types";
import { MOCK_SERVICES } from "@/lib/stellar";

interface AgentPayStats {
  totalEscrows: number;
  completedCount: number;
  successRate: number;
  totalVolume: number;
  pendingCount: number;
}

interface AgentPayStore {
  // Wallet
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
  disconnectWallet: () => void;

  // Demo Mode
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;

  // Escrows
  realEscrows: EscrowRequest[];
  mockEscrows: EscrowRequest[];
  escrows: EscrowRequest[]; // combined list
  addEscrow: (escrow: EscrowRequest) => void;
  completeEscrow: (id: string, resultHash: string) => void;
  expireEscrow: (id: string) => void;

  // Graph nodes/links
  nodes: AgentNode[];
  links: AgentLink[];
  setGraph: (nodes: AgentNode[], links: AgentLink[]) => void;

  // Stats
  stats: AgentPayStats;
  refreshStats: () => void;
}

// Generate relative mock escrows distributed over the last few days/hours
const generateMockEscrows = (): EscrowRequest[] => {
  const now = Math.floor(Date.now() / 1000);
  const hour = 3600;

  return [
    {
      id: "escrow_mock_1",
      clientAddress: "GDCLIENT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      providerAddress: MOCK_SERVICES[0].providerAddress,
      serviceId: MOCK_SERVICES[0].id,
      serviceName: MOCK_SERVICES[0].name,
      amount: 5,
      tokenSymbol: "USDC",
      timeout: now + hour * 2,
      status: "completed",
      requestHash: "0xreq_f2e3a4b5c6d7e8f9...",
      resultHash: "0xres_7d8e9f0a1b2c3d4e...",
      timestamp: now - hour * 1.5,
      txHash: "tx_01a2b3c4d5e6f7g8h9i0j1...",
    },
    {
      id: "escrow_mock_2",
      clientAddress: "GDCLIENT2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      providerAddress: MOCK_SERVICES[2].providerAddress,
      serviceId: MOCK_SERVICES[2].id,
      serviceName: MOCK_SERVICES[2].name,
      amount: 15,
      tokenSymbol: "USDC",
      timeout: now + hour * 4,
      status: "completed",
      requestHash: "0xreq_9a8b7c6d5e4f3g2h...",
      resultHash: "0xres_a1b2c3d4e5f6g7h8...",
      timestamp: now - hour * 3,
      txHash: "tx_02b3c4d5e6f7g8h9i0j1k2...",
    },
    {
      id: "escrow_mock_3",
      clientAddress: MOCK_SERVICES[0].providerAddress, // GPT-4 Agent calling Translator Agent!
      providerAddress: MOCK_SERVICES[1].providerAddress,
      serviceId: MOCK_SERVICES[1].id,
      serviceName: MOCK_SERVICES[1].name,
      amount: 2,
      tokenSymbol: "EURC",
      timeout: now + hour * 1,
      status: "completed",
      requestHash: "0xreq_5f4e3d2c1b0a9f8e...",
      resultHash: "0xres_e8f90a1b2c3d4e5f...",
      timestamp: now - hour * 0.5,
      txHash: "tx_03c4d5e6f7g8h9i0j1k2l3...",
    },
    {
      id: "escrow_mock_4",
      clientAddress: "GDCLIENT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      providerAddress: MOCK_SERVICES[0].providerAddress,
      serviceId: MOCK_SERVICES[0].id,
      serviceName: MOCK_SERVICES[0].name,
      amount: 5,
      tokenSymbol: "USDC",
      timeout: now + hour * 12,
      status: "pending",
      requestHash: "0xreq_e7d8c9b0a1f2e3d4...",
      resultHash: null,
      timestamp: now - hour * 0.1,
      txHash: "tx_04d5e6f7g8h9i0j1k2l3m4...",
    },
    {
      id: "escrow_mock_5",
      clientAddress: "GDCLIENT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      providerAddress: MOCK_SERVICES[3].providerAddress,
      serviceId: MOCK_SERVICES[3].id,
      serviceName: MOCK_SERVICES[3].name,
      amount: 3,
      tokenSymbol: "USDC",
      timeout: now - hour * 2, // expired
      status: "expired",
      requestHash: "0xreq_b1c2d3e4f5a6b7c8...",
      resultHash: null,
      timestamp: now - hour * 5,
      txHash: "tx_05e6f7g8h9i0j1k2l3m4n5...",
    },
  ];
};

const DEFAULT_NODES: AgentNode[] = [
  { id: "agent_analyst", name: "Financial Analyst AI", type: "client", avatar: "🤖", status: "idle" },
  { id: "agent_gpt4", name: "GPT-4 Core", type: "provider", avatar: "🧠", status: "idle" },
  { id: "agent_deepl", name: "DeepL Translation", type: "provider", avatar: "🌍", status: "idle" },
  { id: "agent_diffusion", name: "Stable Diffusion", type: "provider", avatar: "🎨", status: "idle" },
];

const DEFAULT_LINKS: AgentLink[] = [
  { source: "agent_analyst", target: "agent_gpt4", amount: 5, status: "completed" },
  { source: "agent_gpt4", target: "agent_deepl", amount: 2, status: "completed" },
];

export const useAgentPayStore = create<AgentPayStore>((set, get) => ({
  wallet: {
    address: null,
    isConnected: false,
    network: null,
  },
  
  setWallet: (wallet) => set({ wallet }),
  
  disconnectWallet: () => set({ wallet: { address: null, isConnected: false, network: null } }),

  isDemoMode: true, // starts with Demo Mode enabled

  realEscrows: [],
  mockEscrows: [],
  escrows: [],

  nodes: DEFAULT_NODES,
  links: DEFAULT_LINKS,

  setGraph: (nodes, links) => set({ nodes, links }),

  setDemoMode: (enabled) => {
    set((state) => {
      const mocks = enabled ? generateMockEscrows() : [];
      const combined = enabled ? [...state.realEscrows, ...mocks] : state.realEscrows;
      return {
        isDemoMode: enabled,
        mockEscrows: mocks,
        escrows: combined,
      };
    });
    get().refreshStats();
  },

  addEscrow: (escrow) => {
    set((state) => {
      const real = [escrow, ...state.realEscrows];
      const combined = state.isDemoMode ? [...real, state.mockEscrows] : real;
      
      // Update graph nodes and links based on new interaction
      const sourceId = `agent_${escrow.clientAddress.slice(0, 8).toLowerCase()}`;
      const targetId = `agent_${escrow.serviceId}`;

      // Check if node exists, if not add it
      const hasSource = state.nodes.some(n => n.id === sourceId);
      const hasTarget = state.nodes.some(n => n.id === targetId);
      const newNodes = [...state.nodes];
      if (!hasSource) {
        newNodes.push({ id: sourceId, name: `Client Agent (${escrow.clientAddress.slice(0, 6)})`, type: "client", avatar: "🤖", status: "working" });
      }
      if (!hasTarget) {
        newNodes.push({ id: targetId, name: escrow.serviceName, type: "provider", avatar: "🧠", status: "idle" });
      }

      // Add visual link
      const newLink: AgentLink = { source: sourceId, target: targetId, amount: escrow.amount, status: "pending" };
      const newLinks = [newLink, ...state.links];

      return {
        realEscrows: real,
        // typescript cast
        escrows: combined as EscrowRequest[],
        nodes: newNodes,
        links: newLinks,
      };
    });
    get().refreshStats();
  },

  completeEscrow: (id, resultHash) => {
    set((state) => {
      const update = (e: EscrowRequest) =>
        e.id === id ? { ...e, status: "completed" as const, resultHash } : e;
      
      const real = state.realEscrows.map(update);
      const mocks = state.mockEscrows.map(update);
      const combined = state.isDemoMode ? [...real, ...mocks] : real;

      // Update link status in graph visualization
      const escrow = state.escrows.find(e => e.id === id);
      let updatedLinks = state.links;
      if (escrow) {
        const sourceId = `agent_${escrow.clientAddress.slice(0, 8).toLowerCase()}`;
        const targetId = `agent_${escrow.serviceId}`;
        updatedLinks = state.links.map(l =>
          (l.source === sourceId && l.target === targetId) ? { ...l, status: "completed" as const } : l
        );
      }

      return {
        realEscrows: real,
        mockEscrows: mocks,
        escrows: combined,
        links: updatedLinks,
      };
    });
    get().refreshStats();
  },

  expireEscrow: (id) => {
    set((state) => {
      const update = (e: EscrowRequest) =>
        e.id === id ? { ...e, status: "expired" as const } : e;
      const real = state.realEscrows.map(update);
      const mocks = state.mockEscrows.map(update);
      return {
        realEscrows: real,
        mockEscrows: mocks,
        escrows: state.isDemoMode ? [...real, ...mocks] : real,
      };
    });
    get().refreshStats();
  },

  stats: {
    totalEscrows: 0,
    completedCount: 0,
    successRate: 0,
    totalVolume: 0,
    pendingCount: 0,
  },

  refreshStats: () => {
    const list = get().escrows;
    const total = list.length;
    const completed = list.filter(e => e.status === "completed").length;
    const pending = list.filter(e => e.status === "pending").length;
    const volume = list.reduce((s, e) => s + (e.status === "completed" ? e.amount : 0), 0);
    const successRate = total > 0 ? Math.round((completed / (total - pending || 1)) * 100) : 0;

    set({
      stats: {
        totalEscrows: total,
        completedCount: completed,
        successRate,
        totalVolume: volume,
        pendingCount: pending,
      },
    });
  },
}));
