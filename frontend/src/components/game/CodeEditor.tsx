import React, { useState } from 'react';
import { Play, Wrench } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface CodeEditorProps {
  initialCode: string;
  onSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, onSubmit, isLoading }) => {
  const [code, setCode] = useState(initialCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onSubmit(code);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 bg-[#0B0F19] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Editor Header */}
      <div className="bg-[#121826] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">SECURITY_MODULE.C [REPAIR MODE]</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">EDITABLE</span>
      </div>

      {/* Textarea Code Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              soundEngine.playTerminalType();
            }}
            rows={7}
            className="w-full bg-[#070910] border border-white/10 rounded-xl p-4 font-mono text-sm text-cyan-200 focus:outline-none focus:border-cyan-400 transition-colors leading-relaxed resize-none select-text"
            placeholder="Repair the code logic..."
            spellCheck={false}
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end mt-4">
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 active:scale-95 disabled:opacity-50 rounded-xl font-mono font-bold text-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-black" />
            {isLoading ? 'COMPILING & TESTING...' : 'RUN & REPAIR MODULE'}
          </button>
        </div>
      </form>

    </div>
  );
};
