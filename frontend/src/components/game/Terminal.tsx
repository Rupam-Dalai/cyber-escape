import React from 'react';
import { Terminal as TerminalIcon, Search, Image as ImageIcon, Zap, FileText } from 'lucide-react';

interface TerminalProps {
  title: string;
  narrative?: string;
  codeLanguage?: string;
  codeContent?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ title, narrative, codeLanguage = 'c', codeContent }) => {
  const isDetective = codeLanguage === 'detective';
  const isPictogram = codeLanguage === 'pictogram';
  const isGraphical = codeLanguage === 'graphical';

  const borderColor = isDetective
    ? 'border-amber-500/40 shadow-amber-950/20'
    : isPictogram
    ? 'border-purple-500/40 shadow-purple-950/20'
    : isGraphical
    ? 'border-emerald-500/40 shadow-emerald-950/20'
    : 'border-cyan-500/20 shadow-cyan-950/20';

  const headerTitleColor = isDetective
    ? 'text-amber-400'
    : isPictogram
    ? 'text-purple-400'
    : isGraphical
    ? 'text-emerald-400'
    : 'text-cyan-400';

  const badgeStyle = isDetective
    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
    : isPictogram
    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
    : isGraphical
    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
    : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30';

  const textColor = isDetective
    ? 'text-amber-100'
    : isPictogram
    ? 'text-purple-100'
    : isGraphical
    ? 'text-emerald-100'
    : 'text-cyan-100';

  return (
    <div className={`w-full bg-[#0D121D] border rounded-2xl overflow-hidden shadow-2xl transition-all ${borderColor}`}>
      
      {/* Terminal Header Bar */}
      <div className="bg-[#131B2A] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className={`ml-3 text-xs font-mono font-semibold flex items-center gap-1.5 ${headerTitleColor}`}>
            {isDetective ? <Search className="w-3.5 h-3.5" /> : isPictogram ? <ImageIcon className="w-3.5 h-3.5" /> : isGraphical ? <Zap className="w-3.5 h-3.5" /> : <TerminalIcon className="w-3.5 h-3.5" />}
            {title}
          </span>
        </div>

        <span className={`text-[10px] font-mono uppercase border px-2 py-0.5 rounded font-bold ${badgeStyle}`}>
          {isDetective ? 'DETECTIVE DOSSIER' : isPictogram ? 'PICTOGRAM REBUS' : isGraphical ? 'GRAPHICAL MATRIX' : codeLanguage}
        </span>
      </div>

      {/* Narrative Block */}
      {narrative && (
        <div className="px-6 py-4 border-b border-white/5 bg-hunt-surface/40">
          <p className="text-sm italic text-hunt-textMuted leading-relaxed font-sans flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>"{narrative}"</span>
          </p>
        </div>
      )}

      {/* Code / Evidence Content Viewport */}
      {codeContent && (
        <div className={`p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#070A10] ${textColor}`}>
          <pre className="whitespace-pre-wrap select-text font-mono">
            <code>{codeContent}</code>
          </pre>
        </div>
      )}

    </div>
  );
};
