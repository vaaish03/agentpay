"use client";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { format } from "date-fns";
import { ArrowUpRight, CheckCircle2, AlertCircle, Clock, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Dashboard() {
  const { stats, escrows, isDemoMode, refreshStats, nodes, links } = useAgentPayStore();

  useEffect(() => {
    refreshStats();
  }, [escrows, refreshStats]);

  const recentEscrows = escrows.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AgentPay Dashboard</h1>
            {isDemoMode && (
              <span className="bg-accent-green/10 text-accent-green text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-accent-green/20 animate-pulse">
                Demo Mode
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Monitor autonomous AI-to-AI smart contract escrows and network activity in real-time.
          </p>
        </div>
        <Link
          href="/simulation"
          className="bg-accent-green text-black hover:bg-accent-green/90 transition-all font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 self-start md:self-auto shadow-lg shadow-accent-green/10"
        >
          <Cpu size={14} />
          Run Agent Simulation
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Escrows", value: stats.totalEscrows.toString(), icon: Cpu, color: "text-white" },
          { label: "Completed Requests", value: stats.completedCount.toString(), icon: CheckCircle2, color: "text-accent-green" },
          { label: "Pending Escrows", value: stats.pendingCount.toString(), icon: Clock, color: "text-accent-orange" },
          { label: "Success Rate", value: `${stats.successRate}%`, icon: ArrowUpRight, color: "text-accent-green" },
          { label: "Total Volume", value: `$${(stats.totalVolume / 100).toFixed(2)}`, icon: ShieldAlert, color: "text-accent-purple" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon size={14} className={stat.color} />
                </div>
              </div>
              <p className={`text-2xl font-black ${stat.color} mt-2`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Topology Map (SVG Visualizer) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              Agent Connection Topology
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Live visualization of active API billing paths and agent micro-tunnels.
            </p>
          </div>

          {/* Graphical Map */}
          <div className="relative flex-1 flex items-center justify-center my-6 h-64 border border-white/5 rounded-2xl bg-black/20 overflow-hidden">
            <svg className="w-full h-full absolute inset-0 pointer-events-none">
              {/* Draw Link Paths */}
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                // Coordinates for 4 quadrants (simple fixed responsive positions)
                const positions: Record<string, { x: number; y: number }> = {
                  agent_analyst: { x: 20, y: 50 },
                  agent_gpt4: { x: 50, y: 30 },
                  agent_deepl: { x: 80, y: 50 },
                  agent_diffusion: { x: 50, y: 75 },
                };

                const start = positions[link.source] || { x: 30, y: 30 };
                const end = positions[link.target] || { x: 70, y: 70 };

                const isCompleted = link.status === "completed";

                return (
                  <g key={idx}>
                    {/* Background Line */}
                    <line
                      x1={`${start.x}%`}
                      y1={`${start.y}%`}
                      x2={`${end.x}%`}
                      y2={`${end.y}%`}
                      stroke={isCompleted ? "#00FFCC" : "#FF8533"}
                      strokeWidth="2"
                      strokeOpacity="0.15"
                    />
                    {/* Animated Pulse along the path */}
                    <line
                      x1={`${start.x}%`}
                      y1={`${start.y}%`}
                      x2={`${end.x}%`}
                      y2={`${end.y}%`}
                      stroke={isCompleted ? "#00FFCC" : "#FF8533"}
                      strokeWidth="2"
                      strokeDasharray="6, 12"
                      strokeDashoffset="18"
                      strokeOpacity="0.8"
                      className="animate-[dash_2s_linear_infinite]"
                      style={{
                        animation: "dash 3s linear infinite",
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes */}
            <div className="absolute inset-0 flex items-center justify-center">
              {nodes.map((node) => {
                const positions: Record<string, string> = {
                  agent_analyst: "left-[10%] top-[38%]",
                  agent_gpt4: "left-[40%] top-[15%]",
                  agent_deepl: "left-[70%] top-[38%]",
                  agent_diffusion: "left-[40%] top-[65%]",
                };

                // Fallback position for dynamically added nodes
                const pos = positions[node.id] || "left-[20%] top-[70%]";

                return (
                  <div
                    key={node.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${
                      node.status === "working"
                        ? "bg-accent-green/10 border-accent-green/30 scale-105"
                        : "bg-white/5 border-white/10"
                    }`}
                    style={{
                      left: pos.split(" ")[0].replace("left-[", "").replace("]", ""),
                      top: pos.split(" ")[1].replace("top-[", "").replace("]", ""),
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                      {node.avatar}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white font-bold block leading-none">
                        {node.name}
                      </span>
                      <span className="text-[8px] text-text-secondary uppercase tracking-wider block mt-0.5">
                        {node.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted border-t border-white/5 pt-3">
            <span>Graph nodes update dynamically with simulated runs.</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-green" /> Client
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-purple" /> Provider
              </span>
            </div>
          </div>
        </div>

        {/* Recent Escrows List */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-base tracking-wide flex items-center justify-between">
              Recent Escrow Transactions
              <Link href="/escrows" className="text-xs text-accent-green hover:underline">
                View All
              </Link>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Instant snapshot of latest smart contract payments.
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-3 my-4 overflow-y-auto max-h-[300px]">
            {recentEscrows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Clock size={32} className="text-text-muted mb-2" />
                <p className="text-xs text-text-secondary font-medium">No escrows found</p>
                <p className="text-[10px] text-text-muted">Start an agent simulation to see data.</p>
              </div>
            ) : (
              recentEscrows.map((escrow) => {
                const isCompleted = escrow.status === "completed";
                const isPending = escrow.status === "pending";

                return (
                  <div
                    key={escrow.id}
                    className="bg-white/2 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCompleted ? "bg-accent-green/10" : isPending ? "bg-accent-orange/10" : "bg-white/5"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 size={14} className="text-accent-green" />
                        ) : isPending ? (
                          <Clock size={14} className="text-accent-orange" />
                        ) : (
                          <AlertCircle size={14} className="text-text-secondary" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-white font-bold block">
                          {escrow.serviceName}
                        </span>
                        <span className="text-[9px] text-text-secondary block font-mono">
                          ID: {escrow.id.slice(0, 12)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white font-bold block">
                        {(escrow.amount / 100).toFixed(2)} {escrow.tokenSymbol}
                      </span>
                      <span className="text-[9px] text-text-muted block">
                        {format(new Date(escrow.timestamp * 1000), "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-text-muted text-center border-t border-white/5 pt-3">
            Secure, non-custodial escrows managed by Soroban smart contract.
          </div>
        </div>
      </div>

      {/* CSS Animation injection for SVG path movement */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
