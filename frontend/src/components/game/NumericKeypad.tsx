import React, { useState } from 'react';
import { Delete, Check } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface NumericKeypadProps {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ onSubmit, isLoading }) => {
  const [value, setValue] = useState('');

  const handlePress = (num: string) => {
    soundEngine.playClick();
    if (value.length < 8) {
      setValue((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    soundEngine.playClick();
    setValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundEngine.playClick();
    setValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    onSubmit(value);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-hunt-surface/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-950/20">
      
      {/* Keypad Display */}
      <div className="mb-6 bg-[#070A10] border border-amber-500/40 rounded-xl p-4 text-center shadow-inner">
        <span className="text-xs font-mono text-amber-500/70 uppercase block mb-1">ENTER SEQUENCE</span>
        <div className="text-3xl font-mono font-bold tracking-widest text-amber-400 min-h-[40px] flex items-center justify-center">
          {value || <span className="opacity-30 text-2xl">_ _ _ _</span>}
        </div>
      </div>

      {/* Keypad Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handlePress(digit)}
            className="h-14 bg-hunt-elevated hover:bg-amber-500/20 active:bg-amber-500/30 border border-white/10 hover:border-amber-500/50 rounded-xl text-xl font-mono font-bold text-white transition-all shadow-md active:scale-95"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-14 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 rounded-xl font-mono text-xs font-bold text-rose-400 transition-all active:scale-95"
        >
          CLEAR
        </button>

        <button
          type="button"
          onClick={() => handlePress('0')}
          className="h-14 bg-hunt-elevated hover:bg-amber-500/20 active:bg-amber-500/30 border border-white/10 hover:border-amber-500/50 rounded-xl text-xl font-mono font-bold text-white transition-all shadow-md active:scale-95"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="h-14 bg-hunt-elevated hover:bg-amber-500/20 border border-white/10 rounded-xl text-hunt-textMuted flex items-center justify-center transition-all active:scale-95"
        >
          <Delete className="w-5 h-5" />
        </button>

        {/* Submit Keypad Button */}
        <button
          type="submit"
          disabled={!value || isLoading}
          className="col-span-3 mt-3 h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 disabled:opacity-50 rounded-xl font-mono font-bold text-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
        >
          {isLoading ? (
            <span>VALIDATING...</span>
          ) : (
            <>
              <Check className="w-5 h-5" /> SUBMIT SEQUENCE
            </>
          )}
        </button>
      </form>

    </div>
  );
};
