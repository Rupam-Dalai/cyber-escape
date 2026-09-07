import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Hand } from 'lucide-react';

interface VirtualJoystickProps {
  onDirectionInput: (dir: 'up' | 'down' | 'left' | 'right' | 'stop') => void;
  onInteract: () => void;
  canInteract: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onDirectionInput,
  onInteract,
  canInteract,
}) => {
  return (
    <div className="fixed bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none sm:hidden">
      
      {/* D-Pad Controller */}
      <div className="w-36 h-36 bg-black/60 backdrop-blur-md rounded-full border-2 border-cyan-500/40 p-2 relative pointer-events-auto shadow-2xl">
        <button
          onTouchStart={() => onDirectionInput('up')}
          onTouchEnd={() => onDirectionInput('stop')}
          className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-cyan-950/80 active:bg-cyan-500 rounded-xl border border-cyan-500/40 flex items-center justify-center text-cyan-300"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => onDirectionInput('down')}
          onTouchEnd={() => onDirectionInput('stop')}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-cyan-950/80 active:bg-cyan-500 rounded-xl border border-cyan-500/40 flex items-center justify-center text-cyan-300"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => onDirectionInput('left')}
          onTouchEnd={() => onDirectionInput('stop')}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-950/80 active:bg-cyan-500 rounded-xl border border-cyan-500/40 flex items-center justify-center text-cyan-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => onDirectionInput('right')}
          onTouchEnd={() => onDirectionInput('stop')}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-950/80 active:bg-cyan-500 rounded-xl border border-cyan-500/40 flex items-center justify-center text-cyan-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action / Interact Button */}
      <button
        onClick={onInteract}
        disabled={!canInteract}
        className={`w-20 h-20 rounded-full border-2 font-mono font-black text-xs flex flex-col items-center justify-center gap-1 pointer-events-auto transition-all shadow-2xl ${
          canInteract
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300 text-black animate-pulse scale-105 shadow-[0_0_25px_#f59e0b]'
            : 'bg-black/60 border-white/20 text-gray-500 opacity-50'
        }`}
      >
        <Hand className="w-6 h-6" />
        <span>INTERACT</span>
      </button>

    </div>
  );
};
