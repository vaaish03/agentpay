"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Wallet } from "lucide-react";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { truncateAddress } from "@/lib/stellar";
import { connectWallet, checkFreighterConnected } from "@/lib/freighter";
import { useState } from "react";
import toast from "react-hot-toast";

const navTabs = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Agents" },
  { href: "/escrows", label: "Activity" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { wallet, setWallet, disconnectWallet } = useAgentPayStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const isInstalled = await checkFreighterConnected();
      if (!isInstalled) {
        toast.error("Freighter wallet not found. Install it to make payments.");
        return;
      }
      const state = await connectWallet();
      setWallet(state);
      if (state.address) toast.success(`Wallet connected: ${truncateAddress(state.address)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet connection failed";
      toast.error(msg.includes("Access denied") ? "Connection cancelled." : msg);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-white/10 bg-[#0b1220]/85 px-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AgentPay home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-green text-sm font-black text-slate-950">A</div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold tracking-[0.16em] text-white">AGENTPAY</span>
            <span className="block text-[10px] text-slate-400">AI work, paid simply</span>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.035] p-1" aria-label="Main navigation">
          {navTabs.map(({ href, label }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={clsx("rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:text-sm", active ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white")}>{label}</Link>;
          })}
        </nav>

        {wallet.isConnected && wallet.address ? (
          <button onClick={disconnectWallet} className="flex shrink-0 items-center gap-2 rounded-xl border border-accent-green/20 bg-accent-green/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-green/20" title="Disconnect wallet">
            <span className="h-2 w-2 rounded-full bg-accent-green" />
            <span className="font-mono">{truncateAddress(wallet.address, 4)}</span>
          </button>
        ) : (
          <button onClick={handleConnect} disabled={connecting} className="flex shrink-0 items-center gap-2 rounded-xl bg-accent-green px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-[#7ff2df] disabled:opacity-60 sm:px-4">
            <Wallet size={14} />
            <span className="hidden sm:inline">{connecting ? "Connecting…" : "Connect wallet"}</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}
      </div>
    </header>
  );
}
