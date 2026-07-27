"use client";
import { useState } from "react";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { getStellarExpertUrl, truncateAddress, claimPaymentOnChain, refundRequestOnChain } from "@/lib/stellar";
import { signTransaction } from "@/lib/freighter";
import { CheckCircle2, Clock, XCircle, ArrowUpRight, Search } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function Escrows() {
  const { escrows, wallet, completeEscrow, expireEscrow } = useAgentPayStore();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEscrows = escrows.filter((escrow) => {
    const matchesStatus = filterStatus === "all" || escrow.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      escrow.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.clientAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.providerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleClaim = async (id: string) => {
    const isMock = id.includes("mock") || id.includes("sim") || isNaN(parseInt(id.replace("escrow_", "")));
    if (isMock) {
      const simulatedResultHash = `0xres_${Math.random().toString(16).slice(2, 10)}`;
      completeEscrow(id, simulatedResultHash);
      toast.success("Soroban request claimed successfully! (Demo Mode)");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const escrow = escrows.find(e => e.id === id);
    if (!escrow) {
      toast.error("Escrow request not found.");
      return;
    }

    if (wallet.address.toLowerCase() !== escrow.providerAddress.toLowerCase()) {
      toast.error("Only the provider agent account can claim this payment.");
      return;
    }

    const numericId = parseInt(id.replace("escrow_", ""));
    const simulatedResultHash = `0xres_${Math.random().toString(16).slice(2, 10)}`;

    try {
      toast.loading("Submitting on-chain claim payment...", { id: "claim-tx" });
      await claimPaymentOnChain(
        wallet.address,
        numericId,
        simulatedResultHash,
        (xdr) => signTransaction(xdr, wallet.network || "TESTNET")
      );
      completeEscrow(id, simulatedResultHash);
      toast.success("Soroban escrow claimed on-chain successfully!", { id: "claim-tx" });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to submit on-chain claim";
      toast.error(msg, { id: "claim-tx" });
    }
  };

  const handleRefund = async (id: string) => {
    const isMock = id.includes("mock") || id.includes("sim") || isNaN(parseInt(id.replace("escrow_", "")));
    if (isMock) {
      expireEscrow(id);
      toast.success("Soroban escrow refunded successfully! (Demo Mode)");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const escrow = escrows.find(e => e.id === id);
    if (!escrow) {
      toast.error("Escrow request not found.");
      return;
    }

    // Check if the timeout has expired
    const now = Math.floor(Date.now() / 1000);
    if (now < escrow.timeout) {
      const timeLeft = escrow.timeout - now;
      toast.error(`Cannot refund yet. Escrow expires in ${timeLeft} seconds.`);
      return;
    }

    if (wallet.address.toLowerCase() !== escrow.clientAddress.toLowerCase()) {
      toast.error("Only the client agent account can request a refund.");
      return;
    }

    const numericId = parseInt(id.replace("escrow_", ""));

    try {
      toast.loading("Submitting on-chain refund request...", { id: "refund-tx" });
      await refundRequestOnChain(
        wallet.address,
        numericId,
        (xdr) => signTransaction(xdr, wallet.network || "TESTNET")
      );
      expireEscrow(id);
      toast.success("Soroban escrow refunded on-chain successfully!", { id: "refund-tx" });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to submit on-chain refund";
      toast.error(msg, { id: "refund-tx" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your activity</h1>
        <p className="text-text-secondary text-sm mt-1">
          A clear history of requests, payments, and what happened next.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/2 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
          placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-accent-green focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-text-muted transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "pending", "completed", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? "bg-accent-green text-black"
                  : "bg-white/5 text-text-secondary hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Escrows List */}
      <div className="space-y-4">
        {filteredEscrows.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <Clock size={40} className="text-text-muted mb-3" />
            <p className="text-sm text-text-secondary font-bold">No escrows match current filters</p>
            <p className="text-xs text-text-muted mt-0.5">Try adjusting filters or simulating a run.</p>
          </div>
        ) : (
          filteredEscrows.map((escrow) => {
            const isCompleted = escrow.status === "completed";
            const isPending = escrow.status === "pending";
            
            return (
              <div
                key={escrow.id}
                className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all"
              >
                {/* Info Column */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      isCompleted 
                        ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                        : isPending 
                        ? "bg-accent-orange/10 text-accent-orange border-accent-orange/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {isCompleted ? <CheckCircle2 size={10} /> : isPending ? <Clock size={10} /> : <XCircle size={10} />}
                      {escrow.status}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono uppercase">
                      ID: {escrow.id}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base leading-none">
                    {escrow.serviceName}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-[10px] text-text-secondary">
                    <div>
                      <span className="text-text-muted block font-semibold">FROM</span>
                      <span className="font-mono text-white mt-0.5 block">{truncateAddress(escrow.clientAddress, 6)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block font-semibold">TO</span>
                      <span className="font-mono text-white mt-0.5 block">{truncateAddress(escrow.providerAddress, 6)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block font-semibold">REQUEST</span>
                      <span className="font-mono text-white mt-0.5 block truncate max-w-[120px]">{escrow.requestHash}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block font-semibold">RESULT</span>
                      <span className="font-mono text-accent-green mt-0.5 block truncate max-w-[120px]">
                        {escrow.resultHash || "Pending..."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount / Action Column */}
                <div className="flex flex-col items-start md:items-end justify-between h-full min-w-[150px] border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                  <div className="text-left md:text-right mb-4 md:mb-0">
                    <span className="text-lg font-black text-white">
                      {(escrow.amount / 100).toFixed(2)} {escrow.tokenSymbol}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      Created: {format(new Date(escrow.timestamp * 1000), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleClaim(escrow.id)}
                          className="bg-accent-green text-black hover:bg-accent-green/90 transition-all font-bold text-[10px] px-3.5 py-1.5 rounded-lg flex-1 md:flex-none"
                        >
                          Mark as delivered
                        </button>
                        <button
                          onClick={() => handleRefund(escrow.id)}
                          className="bg-white/5 text-red-400 hover:bg-white/10 border border-white/5 transition-all font-bold text-[10px] px-3.5 py-1.5 rounded-lg flex-1 md:flex-none"
                        >
                          Request refund
                        </button>
                      </>
                    )}
                    <a
                      href={getStellarExpertUrl(escrow.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/5 transition-all font-bold text-[10px] px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1 flex-1 md:flex-none"
                    >
                      TX <ArrowUpRight size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
