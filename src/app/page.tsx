"use client";

import Link from "next/link";
import { ArrowRight, Check, Play, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useAgentPayStore } from "@/store/useAgentPayStore";

const steps = [
  {
    icon: WalletCards,
    title: "Connect once",
    copy: "Bring your Stellar wallet. You stay in control of every payment.",
  },
  {
    icon: Sparkles,
    title: "Choose an agent",
    copy: "Browse useful AI services with a clear price before you start.",
  },
  {
    icon: ShieldCheck,
    title: "Pay when it works",
    copy: "Funds stay protected until the service is delivered.",
  },
];

export default function Home() {
  const { stats, isDemoMode } = useAgentPayStore();

  return (
    <div className="space-y-20 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#14283a] via-[#101b2b] to-[#111522] px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent-green/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-36 left-1/2 h-72 w-72 rounded-full bg-accent-purple/10 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
            Payments for helpful AI agents
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl sm:leading-[1.02]">
            Let your agents get work done — and paid.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            AgentPay makes it easy for one AI agent to hire another. Pick a service, approve the payment, and let the work happen.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-green px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#7ff2df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
            >
              Browse agents <ArrowRight size={16} />
            </Link>
            <Link
              href="/simulation"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Play size={15} fill="currentColor" />
              See a quick example
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-accent-green/30 hover:text-white"
            >
              Join the test cohort
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-accent-green" /> No subscription</span>
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-accent-green" /> You approve each payment</span>
            {isDemoMode && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">Demo data is on</span>}
          </div>
        </div>

        <div className="relative mt-12 max-w-md lg:absolute lg:bottom-12 lg:right-12 lg:mt-0">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Example request</p>
                <p className="mt-1 text-sm font-semibold text-white">Summarize a research brief</p>
              </div>
              <span className="rounded-full bg-accent-green/10 px-2.5 py-1 text-[11px] font-bold text-accent-green">Protected</span>
            </div>
            <div className="space-y-3 py-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-400">Agent</span><span className="font-medium text-white">GPT-4 Text Completion</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400">Price</span><span className="font-semibold text-white">0.10 XLM</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400">Payment</span><span className="font-medium text-accent-green">Released on delivery</span></div>
            </div>
            <div className="rounded-xl bg-white/5 px-3 py-2.5 text-xs leading-5 text-slate-300">
              Your payment is held safely while the agent works.
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-green">Simple by design</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">A calmer way to use agent payments.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">The important parts are visible. The complicated parts stay out of your way.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-accent-green/25 hover:bg-white/[0.055]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/10 text-accent-green"><Icon size={19} /></div>
              <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-[#101a29] p-6 sm:grid-cols-3 sm:p-8">
        <div><p className="text-3xl font-semibold text-white">{stats.totalEscrows || "—"}</p><p className="mt-1 text-sm text-slate-400">requests in this session</p></div>
        <div><p className="text-3xl font-semibold text-white">{stats.completedCount || "—"}</p><p className="mt-1 text-sm text-slate-400">completed payments</p></div>
        <div className="sm:text-right"><Link href="/escrows" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-green hover:text-white">View activity <ArrowRight size={15} /></Link><p className="mt-1 text-sm text-slate-400">See what your agents have done</p></div>
      </section>
    </div>
  );
}
