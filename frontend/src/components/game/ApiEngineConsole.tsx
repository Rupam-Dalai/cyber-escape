import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ShieldCheck, CheckCircle2, AlertTriangle, Code, Play, RefreshCw, Database } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface ApiEngineConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'MEMORY_BLAST') => void;
  isSubmitting?: boolean;
}

export const ApiEngineConsole: React.FC<ApiEngineConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [endpoint1Status, setEndpoint1Status] = useState<string>('502');
  const [endpoint2Status, setEndpoint2Status] = useState<string>('500');
  const [endpoint3Status, setEndpoint3Status] = useState<string>('403');
  const [authHeader, setAuthHeader] = useState<string>('NO_AUTH');
  const [payloadType, setPayloadType] = useState<string>('JSON_VALID');
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Fix the 3 microservice endpoints to 200 OK, attach Bearer CYBER_TOKEN, and validate JSON payload.');

  const isPipelineValid =
    endpoint1Status === '200' &&
    endpoint2Status === '200' &&
    endpoint3Status === '200' &&
    authHeader === 'BEARER_CYBER_TOKEN' &&
    payloadType === 'JSON_VALID';

  const handleDeployApi = () => {
    soundEngine.playClick();

    if (payloadType === 'BUFFER_OVERFLOW') {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage('🚨 CRITICAL MEMORY LEAK: Corrupted buffer overflow ruptured API containment!');
      setTimeout(() => {
        onTriggerHazard('MEMORY_BLAST');
      }, 500);
      return;
    }

    if (isPipelineValid) {
      soundEngine.playSuccess();
      soundEngine.playTerminalType();
      setIsDeployed(true);
      setStatusMessage('✓ REST API MICROSERVICE RESTORED! DATABASE VAULT BRIDGE OPENED!');
      setTimeout(() => {
        onSubmit('API_PIPELINE_ACTIVE');
      }, 1200);
    } else {
      soundEngine.playError();
      setStatusMessage('⚠️ API Pipeline error: Ensure all endpoints return 200 OK with Bearer CYBER_TOKEN.');
    }
  };

  return (
    <div className="w-full bg-[#080b12] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative select-none overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-emerald-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
              BACKEND STORE & API ENGINE CONSOLE
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DATABASE GATEWAY
              </span>
            </h3>
            <p className="text-xs text-emerald-200/70 font-mono">
              The Database Vault is locked behind this API engine. Restore endpoints to enable database access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>DB BRIDGE: {isDeployed ? 'ONLINE' : 'LOCKED'}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#0f1d19] border border-emerald-500/30 rounded-2xl p-3 mb-6 flex items-center justify-between gap-4 font-mono text-xs relative z-10">
        <div className="flex items-center gap-2 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 font-bold">
          PIPELINE: {isDeployed ? '100% HEALTHY' : 'RESTRICTED'}
        </div>
      </div>

      {/* Microservice Endpoints Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
        
        {/* Endpoint 1 */}
        <div className="bg-[#0c1417] border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">GET ENDPOINT</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${endpoint1Status === '200' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              HTTP {endpoint1Status}
            </span>
          </div>
          <div className="text-xs font-mono text-white font-bold">/vault/schema</div>
          <div className="grid grid-cols-3 gap-1 pt-2">
            {['502', '404', '200'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  soundEngine.playClick();
                  setEndpoint1Status(code);
                }}
                className={`py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  endpoint1Status === code
                    ? 'bg-emerald-500/30 border-emerald-400 text-white'
                    : 'bg-[#141b24] border-white/10 text-gray-400 hover:border-emerald-500/40'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint 2 */}
        <div className="bg-[#0c1417] border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">POST ENDPOINT</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${endpoint2Status === '200' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              HTTP {endpoint2Status}
            </span>
          </div>
          <div className="text-xs font-mono text-white font-bold">/auth/credentials</div>
          <div className="grid grid-cols-3 gap-1 pt-2">
            {['500', '401', '200'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  soundEngine.playClick();
                  setEndpoint2Status(code);
                }}
                className={`py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  endpoint2Status === code
                    ? 'bg-emerald-500/30 border-emerald-400 text-white'
                    : 'bg-[#141b24] border-white/10 text-gray-400 hover:border-emerald-500/40'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint 3 */}
        <div className="bg-[#0c1417] border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">PUT ENDPOINT</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${endpoint3Status === '200' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              HTTP {endpoint3Status}
            </span>
          </div>
          <div className="text-xs font-mono text-white font-bold">/shield/bypass</div>
          <div className="grid grid-cols-3 gap-1 pt-2">
            {['403', '503', '200'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  soundEngine.playClick();
                  setEndpoint3Status(code);
                }}
                className={`py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  endpoint3Status === code
                    ? 'bg-emerald-500/30 border-emerald-400 text-white'
                    : 'bg-[#141b24] border-white/10 text-gray-400 hover:border-emerald-500/40'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Security Headers & Payload Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#05090f] border border-white/10 rounded-2xl p-4 mb-6 relative z-10">
        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase font-bold mb-2">
            AUTHORIZATION HEADER
          </label>
          <div className="space-y-2">
            {[
              { id: 'NO_AUTH', label: 'None (Unauthenticated)' },
              { id: 'BASIC_AUTH', label: 'Basic Auth (Insecure)' },
              { id: 'BEARER_CYBER_TOKEN', label: 'Bearer CYBER_TOKEN (Root Clearance)' },
            ].map((auth) => (
              <button
                key={auth.id}
                onClick={() => {
                  soundEngine.playClick();
                  setAuthHeader(auth.id);
                }}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold text-left transition-all ${
                  authHeader === auth.id
                    ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-[#0e171f] border-white/10 text-gray-400 hover:border-emerald-500/30'
                }`}
              >
                {auth.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase font-bold mb-2">
            PAYLOAD INTEGRITY PROTOCOL
          </label>
          <div className="space-y-2">
            {[
              { id: 'JSON_VALID', label: 'application/json (Valid Schema)' },
              { id: 'BUFFER_OVERFLOW', label: 'MALFORMED_BUFFER_OVERFLOW (⚠️ Hazard!)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  soundEngine.playClick();
                  setPayloadType(p.id);
                }}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold text-left transition-all ${
                  payloadType === p.id
                    ? p.id === 'BUFFER_OVERFLOW'
                      ? 'bg-rose-500/30 border-rose-400 text-rose-300'
                      : 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-[#0e171f] border-white/10 text-gray-400 hover:border-emerald-500/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deploy Button */}
      <button
        onClick={handleDeployApi}
        disabled={isSubmitting || isDeployed}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98 relative z-10"
      >
        {isDeployed ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>API PIPELINE RESTORED & DEPLOYED</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>RESTORE API MICROSERVICE PIPELINE</span>
          </>
        )}
      </button>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-emerald-200/60">
        <span>Downstream Bridge: Database Security Vault</span>
        <span className="text-rose-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Buffer overflow payloads detonate memory radiation exhaust!
        </span>
      </div>

    </div>
  );
};
