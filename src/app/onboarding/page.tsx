"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> Back home</Link>
      <div className="mt-8 rounded-3xl border border-white/10 bg-[#101a29] p-6 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-green">Join the test cohort</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Tell us how AgentPay feels.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">This short form mirrors the Google Form used for the Level 5 feedback export. Your answers help us make wallet payments easier to understand.</p>
        {submitted ? (
          <div className="mt-8 rounded-2xl border border-accent-green/20 bg-accent-green/10 p-5 text-sm text-accent-green"><CheckCircle2 className="mb-2" size={22} />Thanks — your feedback is ready to be added to the shared response sheet.</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm text-slate-300">Name<input required name="name" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent-green" /></label>
            <label className="block text-sm text-slate-300">Email<input required type="email" name="email" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent-green" /></label>
            <label className="block text-sm text-slate-300">Stellar wallet address<input required name="wallet" placeholder="G…" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none focus:border-accent-green" /></label>
            <label className="block text-sm text-slate-300">Product rating<select required name="rating" defaultValue="" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent-green"><option value="" disabled>Select a rating</option><option>5 — Loved it</option><option>4 — Good</option><option>3 — Okay</option><option>2 — Needs work</option><option>1 — Confusing</option></select></label>
            <label className="block text-sm text-slate-300">What should we improve next?<textarea required name="feedback" rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent-green" /></label>
            <button type="submit" className="w-full rounded-xl bg-accent-green px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#7ff2df]">Send feedback</button>
            <p className="text-xs leading-5 text-slate-500">For the Level 5 submission, responses will be exported to the workbook linked in the README after the owner publishes the authenticated Google Form.</p>
          </form>
        )}
      </div>
    </div>
  );
}
