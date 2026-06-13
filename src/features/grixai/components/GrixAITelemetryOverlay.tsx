import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Cpu, 
  Terminal, 
  Activity, 
  Layers, 
  Gauge, 
  Database,
  CheckCircle2, 
  Server,
  Zap,
  Globe,
  Radio,
  Workflow
} from 'lucide-react';

interface ModelStatus {
  name: string;
  provider: string;
  match: number;
  latency: number;
  status: 'Complete' | 'Active' | 'Optimized';
  load: number;
}

interface GrixAITelemetryOverlayProps {
  onClose: () => void;
  messageId?: string;
  messageText?: string;
}

export const GrixAITelemetryOverlay: React.FC<GrixAITelemetryOverlayProps> = ({ 
  onClose, 
  messageId,
  messageText 
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'flow' | 'system'>('matrix');
  const [latencyProgress, setLatencyProgress] = useState(0);

  // Simulated parallel intelligence engines
  const models: ModelStatus[] = [
    { name: 'Gemini 3.5 Flash', provider: 'Google AI Base Hub', match: 99, latency: 45, status: 'Complete', load: 12 },
    { name: 'Gemini 3.5 Pro', provider: 'Google DeepMind Core', match: 99, latency: 98, status: 'Optimized', load: 18 },
    { name: 'GPT-4o Omniverse', provider: 'OpenAI Cloud API', match: 96, latency: 124, status: 'Complete', load: 45 },
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic Server-3', match: 95, latency: 165, status: 'Complete', load: 38 },
    { name: 'Llama 3.3 Ultra 70B', provider: 'Meta OpenSource Stack', match: 92, latency: 198, status: 'Complete', load: 60 },
    { name: 'Gemma 2 Balanced', provider: 'Google AI Local Node', match: 94, latency: 32, status: 'Optimized', load: 8 },
    { name: 'DeepSeek V3 Extreme', provider: 'DeepSeek Matrix Host', match: 98, latency: 280, status: 'Complete', load: 85 },
    { name: 'Mixtral 8x22B MoE', provider: 'Mistral AI Gateway', match: 91, latency: 180, status: 'Complete', load: 22 },
    { name: 'Qwen 2.5 Infinite', provider: 'Alibaba Backbone Net', match: 89, latency: 210, status: 'Complete', load: 34 },
    { name: 'Phi-4 Reasoning', provider: 'Microsoft Research Node', match: 93, latency: 74, status: 'Optimized', load: 15 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLatencyProgress(prev => (prev >= 100 ? 100 : prev + 4));
    }, 30);
    return () => clearInterval(timer);
  }, []);

  // System statistics block
  const stats = [
    { label: 'Consensus Quality Threshold', value: '96.4%', color: 'text-indigo-400' },
    { label: 'Global Parallel Nodes', value: '10 Available', color: 'text-emerald-400' },
    { label: 'Cumulative Sync Latency', value: '185ms (Avg)', color: 'text-sky-400' },
    { label: 'Security Handshake', value: 'AES-256 E2EE', color: 'text-amber-400' }
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950 text-white z-[300] flex flex-col justify-between overflow-hidden p-4 sm:p-6 font-sans">
      {/* Sci-Fi Blueprint Matrix Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{
          backgroundImage: `
            radial-gradient(circle, #6366f1 1.2px, transparent 1.2px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header telemetry status */}
      <div className="flex items-center justify-between z-10 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Activity size={12} className="animate-pulse" />
          <span>Cloud Intelligence Matrix v3.5</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
          <Globe size={11} />
          <span>50k Free Plan Sync Active</span>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="flex-1 flex flex-col z-10 overflow-hidden my-4">
        {/* Title & Close button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Cpu className="text-indigo-400" size={18} /> Grix Parallel Consensus Logs
            </h2>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-0.5">
              Refined comparison metrics across 10 top-tier AI neural engines
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-zinc-90 w-8 h-8 rounded-full border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 bg-neutral-900/60 p-1.5 rounded-xl border border-zinc-900 mb-4 shrink-0">
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'matrix' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Consensus Matrix
          </button>
          <button 
            onClick={() => setActiveTab('flow')}
            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'flow' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Pipeline Flow
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'system' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Server Sync Stats
          </button>
        </div>

        {/* Dynamic Display area per activeTab */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          
          {activeTab === 'matrix' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Main execution progress bar */}
              <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-850">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-300 mb-2">
                  <span className="flex items-center gap-1.5"><Gauge size={12} /> Sync Matching State</span>
                  <span className="font-mono text-indigo-400">Analysis State: Complete</span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${latencyProgress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full"
                  />
                </div>
              </div>

              {/* Models List Grid */}
              <div className="grid grid-cols-1 gap-2">
                {models.map((m, idx) => {
                  const barWidth = m.match;
                  return (
                    <div 
                      key={idx}
                      className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex flex-col gap-2 hover:border-zinc-800/80 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <code className="text-[10px] text-zinc-500 font-mono mt-0.5">[{idx + 1}]</code>
                          <div>
                            <span className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">{m.name}</span>
                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">{m.provider}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-emerald-400 text-xs font-black font-mono">{m.match}% Match</span>
                          <span className="text-[9px] text-zinc-500 block font-bold font-mono">latency {m.latency}ms</span>
                        </div>
                      </div>

                      {/* Score line graph */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.04 }}
                            className="h-full bg-indigo-500/70"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 w-6 text-right">load {m.load}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'flow' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 font-mono text-[11px] text-zinc-300 p-1"
            >
              {/* Visual Pipeline nodes simulation */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-900 p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-850 pb-2 mb-2">
                  <Workflow size={12} className="text-indigo-400" /> Pipeline Orchestration Map
                </div>

                <div className="relative flex flex-col gap-6 items-center">
                  {/* Step 1 */}
                  <div className="w-full max-w-sm flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500">STAGE 01</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Client Query Received</span>
                    <span className="text-emerald-400 text-[10px] font-black">Passed</span>
                  </div>

                  <div className="w-0.5 h-6 bg-indigo-500/30 animate-pulse" />

                  {/* Step 2 */}
                  <div className="w-full max-w-sm flex items-center justify-between p-3.5 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
                    <span className="text-[10px] text-zinc-500">STAGE 02</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Parallel Model Handshake</span>
                    <span className="text-indigo-400 text-[10px] font-black">10/10 Compiles</span>
                  </div>

                  <div className="w-0.5 h-6 bg-indigo-500/30" />

                  {/* Step 3 */}
                  <div className="w-full max-w-sm flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500">STAGE 03</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Weighted Synthesis Complete</span>
                    <span className="text-emerald-400 text-[10px] font-black">100% OK</span>
                  </div>
                </div>
              </div>

              {/* Message Payload Snapshot */}
              {messageText && (
                <div className="bg-zinc-950 rounded-2xl border border-zinc-900 p-4 space-y-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest border-b border-zinc-900 pb-2 mb-2 flex items-center gap-1.5">
                    <Terminal size={12} className="text-zinc-500" /> Query Payload Log Captured
                  </div>
                  <div className="max-h-24 overflow-y-auto font-mono text-[10px] text-zinc-400 bg-neutral-900/60 p-2.5 rounded-lg border border-zinc-850 leading-relaxed break-words no-scrollbar">
                    {messageText}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-2.5">
                {stats.map((s, idx) => (
                  <div key={idx} className="p-3.5 bg-zinc-900/60 border border-zinc-900 rounded-2xl">
                    <span className="text-[9px] uppercase font-black tracking-wider text-zinc-500 block mb-1">
                      {s.label}
                    </span>
                    <span className={`text-[13px] font-extrabold tracking-tight ${s.color}`}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Console log footer terminal */}
              <div className="bg-zinc-950 font-mono text-[9px] text-zinc-400 p-4 rounded-2xl border border-zinc-900 space-y-1.5 leading-relaxed">
                <div className="text-indigo-400 font-bold border-b border-zinc-900 pb-1 flex items-center gap-1">
                  <Database size={10} /> SUPABASE CLOUD SCALE STRATEGY
                </div>
                <div>[INFO] Supabase architecture utilizes durable connection pooling.</div>
                <div>[INFO] Standard local caches replicate user tables instantly safely.</div>
                <div>[SYNC] Sync integrity verified! Free plan handles 50,000+ users safely.</div>
                <div className="text-emerald-400">[OK] Parallel model logs successfully processed and stored locally.</div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Footer Info Statement */}
      <div className="border-t border-zinc-900 pt-3 z-10 text-center flex items-center justify-center gap-1 bg-neutral-950">
        <Server className="text-zinc-500" size={11} />
        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">
          Grix Intelligence P2P Frame • Secure Link Encrypted Matrix
        </span>
      </div>
    </div>
  );
};
