"use client";
import { useState, useEffect, useRef } from "react";
import { useAgentPayStore } from "@/store/useAgentPayStore";
import { MOCK_SERVICES } from "@/lib/stellar";
import { Play, RotateCcw, Terminal as TerminalIcon, Cpu, Zap, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface LogEntry {
  time: string;
  message: string;
  type: "system" | "agent" | "contract" | "success";
}

export default function Simulation() {
  const { addEscrow, completeEscrow } = useAgentPayStore();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (message: string, type: LogEntry["type"] = "agent") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  };

  const resetSimulation = () => {
    setLogs([]);
    setIsRunning(false);
    toast.success("Simulation console cleared.");
  };

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    
    if (selectedWorkflow === 1) {
      runWorkflowOne();
    } else if (selectedWorkflow === 2) {
      runWorkflowTwo();
    } else {
      runWorkflowThree();
    }
  };

  // Workflow 1: Analyst AI hires GPT-4 to summarize a document
  const runWorkflowOne = () => {
    const steps = [
      {
        delay: 500,
        action: () => addLog("Analyst AI initiated document summarization workflow...", "system"),
      },
      {
        delay: 1500,
        action: () => {
          addLog("Analyst AI locking 0.05 USDC in Soroban Smart Contract for GPT-4 Core...", "agent");
          // Add to store ledger
          const now = Math.floor(Date.now() / 1000);
          addEscrow({
            id: "escrow_sim_w1",
            clientAddress: "GDANALYSTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            providerAddress: MOCK_SERVICES[0].providerAddress,
            serviceId: MOCK_SERVICES[0].id,
            serviceName: MOCK_SERVICES[0].name,
            amount: 5,
            tokenSymbol: "USDC",
            timeout: now + 3600,
            status: "pending",
            requestHash: "0xreq_sum_001",
            resultHash: null,
            timestamp: now,
            txHash: "tx_sim_w1_01",
          });
        },
      },
      {
        delay: 2500,
        action: () => addLog("Soroban Contract: Escrow locked. Request created (ID: escrow_sim_w1). Emit: req_new", "contract"),
      },
      {
        delay: 4000,
        action: () => addLog("GPT-4 Core: Detected active escrow. Starting summarization task...", "agent"),
      },
      {
        delay: 6000,
        action: () => addLog("GPT-4 Core: Summarization completed. Generating response payload.", "agent"),
      },
      {
        delay: 7500,
        action: () => {
          addLog("GPT-4 Core: Submitting output and claiming 0.05 USDC with result proof...", "agent");
          completeEscrow("escrow_sim_w1", "0xres_sum_001");
        },
      },
      {
        delay: 8500,
        action: () => addLog("Soroban Contract: Proof verified. 0.05 USDC transferred to GPT-4 Core. Emit: req_done", "contract"),
      },
      {
        delay: 9500,
        action: () => {
          addLog("Analyst AI received summary. Workflow successfully settled!", "success");
          setIsRunning(false);
        },
      },
    ];

    executeSteps(steps);
  };

  // Workflow 2: Analyst AI hires GPT-4, which then automatically hires DeepL Agent to translate
  const runWorkflowTwo = () => {
    const steps = [
      {
        delay: 500,
        action: () => addLog("Analyst AI initiated localized summary workflow...", "system"),
      },
      {
        delay: 1500,
        action: () => {
          addLog("Analyst AI locking 0.05 USDC in Soroban for GPT-4 Core...", "agent");
          const now = Math.floor(Date.now() / 1000);
          addEscrow({
            id: "escrow_sim_w2_a",
            clientAddress: "GDANALYSTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            providerAddress: MOCK_SERVICES[0].providerAddress,
            serviceId: MOCK_SERVICES[0].id,
            serviceName: MOCK_SERVICES[0].name,
            amount: 5,
            tokenSymbol: "USDC",
            timeout: now + 3600,
            status: "pending",
            requestHash: "0xreq_loc_sum_a",
            resultHash: null,
            timestamp: now,
            txHash: "tx_sim_w2_01",
          });
        },
      },
      {
        delay: 2500,
        action: () => addLog("Soroban Contract: Escrow locked. Request created (ID: escrow_sim_w2_a). Emit: req_new", "contract"),
      },
      {
        delay: 4000,
        action: () => addLog("GPT-4 Core: Detected escrow. Summarization complete. Translation to German required.", "agent"),
      },
      {
        delay: 5500,
        action: () => {
          addLog("GPT-4 Core (Autonomous): Locking 0.02 EURC in Soroban for DeepL Translator...", "agent");
          const now = Math.floor(Date.now() / 1000);
          addEscrow({
            id: "escrow_sim_w2_b",
            clientAddress: MOCK_SERVICES[0].providerAddress,
            providerAddress: MOCK_SERVICES[1].providerAddress,
            serviceId: MOCK_SERVICES[1].id,
            serviceName: MOCK_SERVICES[1].name,
            amount: 2,
            tokenSymbol: "EURC",
            timeout: now + 3600,
            status: "pending",
            requestHash: "0xreq_loc_trans_b",
            resultHash: null,
            timestamp: now,
            txHash: "tx_sim_w2_02",
          });
        },
      },
      {
        delay: 6500,
        action: () => addLog("Soroban Contract: Escrow locked. Request created (ID: escrow_sim_w2_b). Emit: req_new", "contract"),
      },
      {
        delay: 8000,
        action: () => addLog("DeepL Agent: Detected escrow. Commencing German translation...", "agent"),
      },
      {
        delay: 10000,
        action: () => {
          addLog("DeepL Agent: Submitting translation and claiming 0.02 EURC...", "agent");
          completeEscrow("escrow_sim_w2_b", "0xres_loc_trans_b");
        },
      },
      {
        delay: 11000,
        action: () => addLog("Soroban Contract: Proof verified. 0.02 EURC released to DeepL Agent. Emit: req_done", "contract"),
      },
      {
        delay: 12500,
        action: () => {
          addLog("GPT-4 Core: Received German translation. Submitting final localized package to Analyst AI...", "agent");
          completeEscrow("escrow_sim_w2_a", "0xres_loc_sum_a");
        },
      },
      {
        delay: 13500,
        action: () => addLog("Soroban Contract: Proof verified. 0.05 USDC released to GPT-4 Core. Emit: req_done", "contract"),
      },
      {
        delay: 14500,
        action: () => {
          addLog("Analyst AI: Localized document summary delivered! Agent Pay mesh execution completed.", "success");
          setIsRunning(false);
        },
      },
    ];

    executeSteps(steps);
  };

  // Workflow 3: GPT-4 writes prompt, then automatically hires Stable Diffusion to generate image
  const runWorkflowThree = () => {
    const steps = [
      {
        delay: 500,
        action: () => addLog("Client AI Agent initiated text-to-image workflow...", "system"),
      },
      {
        delay: 1500,
        action: () => {
          addLog("Client Agent locking 0.05 USDC in Soroban for GPT-4 Prompt Writer...", "agent");
          const now = Math.floor(Date.now() / 1000);
          addEscrow({
            id: "escrow_sim_w3_a",
            clientAddress: "GDCLIENT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            providerAddress: MOCK_SERVICES[0].providerAddress,
            serviceId: MOCK_SERVICES[0].id,
            serviceName: MOCK_SERVICES[0].name,
            amount: 5,
            tokenSymbol: "USDC",
            timeout: now + 3600,
            status: "pending",
            requestHash: "0xreq_img_prompt_a",
            resultHash: null,
            timestamp: now,
            txHash: "tx_sim_w3_01",
          });
        },
      },
      {
        delay: 2500,
        action: () => addLog("Soroban Contract: Escrow locked. Request created (ID: escrow_sim_w3_a). Emit: req_new", "contract"),
      },
      {
        delay: 4000,
        action: () => addLog("GPT-4 Core: Detected escrow. Prompt generated successfully. Image generation required.", "agent"),
      },
      {
        delay: 5500,
        action: () => {
          addLog("GPT-4 Core (Autonomous): Locking 0.15 USDC in Soroban for Stable Diffusion 3 Agent...", "agent");
          const now = Math.floor(Date.now() / 1000);
          addEscrow({
            id: "escrow_sim_w3_b",
            clientAddress: MOCK_SERVICES[0].providerAddress,
            providerAddress: MOCK_SERVICES[2].providerAddress,
            serviceId: MOCK_SERVICES[2].id,
            serviceName: MOCK_SERVICES[2].name,
            amount: 15,
            tokenSymbol: "USDC",
            timeout: now + 3600,
            status: "pending",
            requestHash: "0xreq_img_gen_b",
            resultHash: null,
            timestamp: now,
            txHash: "tx_sim_w3_02",
          });
        },
      },
      {
        delay: 6500,
        action: () => addLog("Soroban Contract: Escrow locked. Request created (ID: escrow_sim_w3_b). Emit: req_new", "contract"),
      },
      {
        delay: 8000,
        action: () => addLog("Stable Diffusion: Detected escrow. Commencing image generation rendering cycles...", "agent"),
      },
      {
        delay: 11000,
        action: () => {
          addLog("Stable Diffusion: Image generated. Submitting output asset and claiming 0.15 USDC...", "agent");
          completeEscrow("escrow_sim_w3_b", "0xres_img_gen_b");
        },
      },
      {
        delay: 12000,
        action: () => addLog("Soroban Contract: Proof verified. 0.15 USDC transferred to Stable Diffusion. Emit: req_done", "contract"),
      },
      {
        delay: 13500,
        action: () => {
          addLog("GPT-4 Core: Image received. Submitting final assets back to Client Agent...", "agent");
          completeEscrow("escrow_sim_w3_a", "0xres_img_prompt_a");
        },
      },
      {
        delay: 14500,
        action: () => addLog("Soroban Contract: Proof verified. 0.05 USDC released to GPT-4 Core. Emit: req_done", "contract"),
      },
      {
        delay: 15500,
        action: () => {
          addLog("Client Agent: Complete workflow resolved! Image delivered successfully.", "success");
          setIsRunning(false);
        },
      },
    ];

    executeSteps(steps);
  };

  const executeSteps = (steps: { delay: number; action: () => void }[]) => {
    steps.forEach((step) => {
      setTimeout(() => {
        step.action();
      }, step.delay);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          Try a sample workflow
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          See how one agent can hire another in a few simple steps. This example uses demo data only.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="glass-panel rounded-3xl p-6 self-start space-y-6">
          <div>
            <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              <Cpu size={16} className="text-accent-green" />
              Choose an example
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Pick a story to play through.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 1,
                name: "1. Document Summarization",
                desc: "Financial Analyst hires GPT-4 to summarize research ($0.05 USDC).",
              },
              {
                id: 2,
                name: "2. Autonomous Translation Delegation",
                desc: "Analyst hires GPT-4, which then delegates translation tasks to DeepL ($0.02 EURC).",
              },
              {
                id: 3,
                name: "3. Media Generation Pipeline",
                desc: "Client hires GPT-4 to compose a prompt, which hires Stable Diffusion to render ($0.15 USDC).",
              },
            ].map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => !isRunning && setSelectedWorkflow(workflow.id)}
                disabled={isRunning}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedWorkflow === workflow.id
                    ? "bg-accent-green/10 border-accent-green/30"
                    : "bg-white/2 border-white/5 hover:bg-white/5"
                } disabled:opacity-50`}
              >
                <span className="text-xs text-white font-bold block">{workflow.name}</span>
                <span className="text-[10px] text-text-secondary block mt-1 leading-normal">
                  {workflow.desc}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex-1 bg-accent-green text-black disabled:opacity-50 hover:bg-accent-green/90 transition-all font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Play size={14} />
              Start Run
            </button>
            <button
              onClick={resetSimulation}
              disabled={isRunning}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all font-bold text-xs p-2.5 rounded-xl"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Console Log Terminal */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between h-[500px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              <TerminalIcon size={16} className="text-accent-purple" />
              Execution Console
            </h3>
            <span className="bg-white/5 border border-white/5 text-[9px] text-text-secondary font-mono px-2 py-0.5 rounded-md">
              Terminal: zsh
            </span>
          </div>

          {/* Logs Terminal Area */}
          <div className="flex-1 my-4 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2.5">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-muted">
                <Zap size={24} className="mb-1.5 animate-pulse" />
                <span>Ready to execute. Press &apos;Start Run&apos; to trigger workflow.</span>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-text-muted flex-shrink-0 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === "system"
                        ? "text-accent-purple"
                        : log.type === "contract"
                        ? "text-accent-orange font-bold"
                        : log.type === "success"
                        ? "text-accent-green font-bold"
                        : "text-white"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <ShieldCheck size={12} className="text-accent-green" />
            <span>Soroban virtual machine ledger checks enforced on all events.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
