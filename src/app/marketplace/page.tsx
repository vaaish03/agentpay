"use client";
import { useState } from "react";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { MOCK_SERVICES, MOCK_TOKENS, truncateAddress, createEscrowRequestOnChain, registerServiceOnChain } from "@/lib/stellar";
import { signTransaction } from "@/lib/freighter";
import { Cpu, Plus, PlusCircle, CheckCircle, Database, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { AgentService } from "@/types";

export default function Marketplace() {
  const { wallet, escrows, addEscrow, isDemoMode } = useAgentPayStore();
  const [services, setServices] = useState<AgentService[]>([...MOCK_SERVICES]);
  
  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [regToken, setRegToken] = useState("USDC");
  const [regCategory, setRegCategory] = useState<AgentService["category"]>("LLM");

  // Escrow Placement State
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected || !wallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!regName || !regDesc || !regPrice) {
      toast.error("Please fill in all service details.");
      return;
    }

    const priceCents = Math.round(parseFloat(regPrice) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Price must be a valid positive number.");
      return;
    }

    setRegistering(true);
    const serviceId = `custom_${Date.now()}`;
    const tokenAddress = regToken === "USDC" ? MOCK_TOKENS.USDC : MOCK_TOKENS.EURC;

    try {
      toast.loading("Registering AI Service on-chain...", { id: "register-tx" });
      
      await registerServiceOnChain(
        wallet.address,
        serviceId,
        priceCents,
        tokenAddress,
        (xdr) => signTransaction(xdr, wallet.network || "TESTNET")
      );

      const newService: AgentService = {
        id: serviceId,
        providerAddress: wallet.address,
        name: regName,
        description: regDesc,
        price: priceCents,
        tokenAddress: tokenAddress,
        category: regCategory,
      };

      setServices([newService, ...services]);
      toast.success("AI Service registered on Soroban successfully!", { id: "register-tx" });

      // Clear form
      setRegName("");
      setRegDesc("");
      setRegPrice("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register service on-chain", { id: "register-tx" });
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateEscrow = async (service: AgentService) => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error("Please connect your wallet to fund this request.");
      return;
    }

    setLoadingServiceId(service.id);
    const timeoutSeconds = 120; // 2 minutes (shortened for convenient testing of on-chain refunds)

    try {
      toast.loading("Initiating Soroban Escrow Transaction...", { id: "escrow-tx" });
      
      const { txHash, requestId } = await createEscrowRequestOnChain(
        wallet.address,
        service.providerAddress,
        service.id,
        service.price,
        timeoutSeconds,
        (xdr) => signTransaction(xdr, wallet.network || "TESTNET")
      );

      const now = Math.floor(Date.now() / 1000);
      const newEscrow = {
        id: `escrow_${requestId}`,
        clientAddress: wallet.address,
        providerAddress: service.providerAddress,
        serviceId: service.id,
        serviceName: service.name,
        amount: service.price,
        tokenSymbol: "XLM",
        timeout: now + timeoutSeconds,
        status: "pending" as const,
        requestHash: `0xreq_${Math.random().toString(16).slice(2, 10)}`,
        resultHash: null,
        timestamp: now,
        txHash: txHash,
      };

      addEscrow(newEscrow);
      toast.success(`Escrow contract initialized! ID: ${requestId}`, { id: "escrow-tx" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create on-chain request", { id: "escrow-tx" });
    } finally {
      setLoadingServiceId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          Agent Marketplace
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Rent autonomous AI computational pipelines or register your own AI Agent services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Marketplace Services List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-white font-bold text-lg mb-2">Available AI Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-accent-green/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-white/5 border border-white/5 text-[10px] text-accent-green font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {service.category}
                    </span>
                    <span className="text-xs text-text-secondary font-semibold font-mono">
                      {(service.price / 100).toFixed(2)}{" "}
                      {service.tokenAddress === MOCK_TOKENS.USDC ? "USDC" : "EURC"}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{service.name}</h4>
                  <p className="text-text-secondary text-[11px] leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 mt-auto flex items-center justify-between">
                  <span className="text-[9px] text-text-muted font-mono">
                    Provider: {truncateAddress(service.providerAddress, 5)}
                  </span>
                  <button
                    onClick={() => handleCreateEscrow(service)}
                    disabled={loadingServiceId === service.id}
                    className="bg-accent-green text-black hover:bg-accent-green/90 disabled:opacity-50 transition-all font-bold text-[10px] px-3.5 py-1.5 rounded-lg"
                  >
                    {loadingServiceId === service.id ? "Initializing..." : "Hire Agent"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Register Service Form */}
        <div className="glass-panel rounded-3xl p-6 self-start">
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <PlusCircle className="text-accent-green" size={18} />
            Register AI Service
          </h3>
          <p className="text-[11px] text-text-secondary mb-4">
            Register your off-chain AI agent as a service provider on Soroban.
          </p>

          <form onSubmit={handleRegisterService} className="space-y-4">
            <div>
              <label className="text-text-secondary text-[10px] uppercase font-bold block mb-1.5">
                Service Name
              </label>
              <input
                type="text"
                placeholder="e.g. LLM Translation Agent"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-text-muted transition-colors"
              />
            </div>

            <div>
              <label className="text-text-secondary text-[10px] uppercase font-bold block mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Describe what services your AI agent performs..."
                rows={3}
                value={regDesc}
                onChange={(e) => setRegDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-text-muted transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-[10px] uppercase font-bold block mb-1.5">
                  Price ($ / Call)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.05"
                  value={regPrice}
                  onChange={(e) => setRegPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-text-muted transition-colors"
                />
              </div>

              <div>
                <label className="text-text-secondary text-[10px] uppercase font-bold block mb-1.5">
                  Token Asset
                </label>
                <select
                  value={regToken}
                  onChange={(e) => setRegToken(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-colors"
                >
                  <option value="USDC">USDC</option>
                  <option value="EURC">EURC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-[10px] uppercase font-bold block mb-1.5">
                Service Category
              </label>
              <select
                value={regCategory}
                onChange={(e) => setRegCategory(e.target.value as AgentService["category"])}
                className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-colors"
              >
                <option value="LLM">LLM (Language Model)</option>
                <option value="Translation">Translation</option>
                <option value="ImageGen">Image Generation</option>
                <option value="Audio">Audio Processing</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full bg-accent-purple text-white hover:bg-accent-purple/90 disabled:opacity-50 transition-all font-bold text-xs py-2.5 rounded-xl mt-2 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              {registering ? "Registering..." : "Register Service"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
