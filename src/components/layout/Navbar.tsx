"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Wallet, Info, Activity } from "lucide-react";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { truncateAddress } from "@/lib/stellar";
import { connectWallet, checkFreighterConnected } from "@/lib/freighter";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const navTabs = [
  { href: "/",           label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/escrows",     label: "Escrows" },
  { href: "/simulation",  label: "Simulation" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { wallet, setWallet, disconnectWallet, isDemoMode, setDemoMode } = useAgentPayStore();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setDemoMode(isDemoMode);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const isInstalled = await checkFreighterConnected();
      if (!isInstalled) {
        toast.error("Freighter extension not detected. Please install Freighter from https://www.freighter.app/");
        return;
      }

      const state = await connectWallet();
      setWallet(state);
      if (state.address) {
        toast.success(`Wallet connected: ${truncateAddress(state.address)}`);
        setDemoMode(false); // Turn off Demo Mode automatically when real wallet is connected
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Freighter connection failed";
      if (msg.includes("Access denied")) {
        toast.error("Connection rejected. Please approve the Freighter permission request.");
      } else {
        toast.error(msg);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success("Wallet disconnected");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-bg-primary/80 backdrop-blur-md border-b border-border-glass flex items-center justify-between px-8 z-50">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-green to-accent-purple flex items-center justify-center font-bold text-black text-sm">
          A⚡
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-wider">AGENT PAY</span>
          <p className="text-[10px] text-text-secondary leading-none">AI Micropayments</p>
        </div>
      </div>

      {/* Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 rounded-2xl p-1">
        {navTabs.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300",
                active
                  ? "bg-accent-green text-black shadow-lg shadow-accent-green/20"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5">
          <span className="text-xs text-text-secondary font-semibold">Demo Mode</span>
          <button
            onClick={() => {
              setDemoMode(!isDemoMode);
              toast.success(`Demo Mode: ${!isDemoMode ? "ON" : "OFF"}`);
            }}
            className={clsx(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              isDemoMode ? "bg-accent-green" : "bg-white/10"
            )}
          >
            <span
              className={clsx(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                isDemoMode ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Wallet Button */}
        {wallet.isConnected && wallet.address ? (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 bg-accent-purple/20 border border-accent-purple/30 rounded-xl px-4 py-1.5 hover:bg-accent-purple/30 transition-all"
            title="Click to disconnect"
          >
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-white text-xs font-semibold font-mono">
              {truncateAddress(wallet.address, 4)}
            </span>
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 bg-white/10 border border-white/10 text-white rounded-xl px-4 py-1.5 hover:bg-white/15 active:scale-95 transition-all text-xs font-semibold"
          >
            <Wallet size={13} className="text-accent-green" />
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
