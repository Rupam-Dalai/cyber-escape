import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle2, XCircle, Terminal as TerminalIcon, Sparkles, Wrench, Lightbulb, Play } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface InteractiveDebugScreenProps {
  initialCode?: string;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
}

interface CodeLine {
  lineNum: number;
  content: string;
  isBuggy: boolean;
  fixOptions?: string[];
  correctFix?: string;
}

interface TestCase {
  id: number;
  description: string;
  balance: number;
  cost: number;
  burst: number;
  expectedOutput: string;
  buggyOutput: string;
  patchedOutput: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    description: 'calculate_request_billing(balance=100, cost=15, burst=2)',
    balance: 100,
    cost: 15,
    burst: 2,
    expectedOutput: 'balance: 70 (GRANTED)',
    buggyOutput: 'balance: 130 (OVER-CREDITED)',
    patchedOutput: 'balance: 70 (GRANTED)',
  },
  {
    id: 2,
    description: 'calculate_request_billing(balance=50, cost=25, burst=2)',
    balance: 50,
    cost: 25,
    burst: 2,
    expectedOutput: 'balance: 0 (GRANTED)',
    buggyOutput: 'balance: 100 (OVER-CREDITED)',
    patchedOutput: 'balance: 0 (GRANTED)',
  },
  {
    id: 3,
    description: 'calculate_request_billing(balance=40, cost=25, burst=2)',
    balance: 40,
    cost: 25,
    burst: 2,
    expectedOutput: 'status: 429 (INSUFFICIENT_CREDITS)',
    buggyOutput: 'balance: 90 (UNAUTHORIZED OVERDRAFT)',
    patchedOutput: 'status: 429 (INSUFFICIENT_CREDITS)',
  },
];

const ARITHMETIC_CODE_LINES: CodeLine[] = [
  { lineNum: 1, content: '# Microservice Gateway Rate Limiter & Arithmetic Billing Controller', isBuggy: false },
  { lineNum: 2, content: 'def calculate_request_billing(user_balance, request_cost, burst_multiplier):', isBuggy: false },
  { lineNum: 3, content: '    base_charge = request_cost * burst_multiplier', isBuggy: false },
  { lineNum: 4, content: '    ', isBuggy: false },
  { lineNum: 5, content: '    # Deduct compute charges from current user credit balance:', isBuggy: false },
  {
    lineNum: 6,
    content: '    remaining_balance = user_balance + base_charge',
    isBuggy: true,
    fixOptions: [
      'remaining_balance = user_balance - base_charge',
      'remaining_balance = user_balance * base_charge',
      'remaining_balance = user_balance / (base_charge + 1)',
      'remaining_balance = user_balance + (base_charge * 2)',
    ],
    correctFix: 'remaining_balance = user_balance - base_charge',
  },
  { lineNum: 7, content: '    ', isBuggy: false },
  { lineNum: 8, content: '    if remaining_balance >= 0:', isBuggy: false },
  { lineNum: 9, content: '        return {"status": 200, "allowance": "GRANTED", "balance": remaining_balance}', isBuggy: false },
  { lineNum: 10, content: '    ', isBuggy: false },
  { lineNum: 11, content: '    return {"status": 429, "error": "INSUFFICIENT_COMPUTE_CREDITS"}', isBuggy: false },
];

export const InteractiveDebugScreen: React.FC<InteractiveDebugScreenProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [selectedLine, setSelectedLine] = useState<CodeLine | null>(ARITHMETIC_CODE_LINES[5]); // Default to Line 6
  const [selectedFix, setSelectedFix] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const handleLineClick = (line: CodeLine) => {
    if (!line.content.trim()) return;
    soundEngine.playClick();
    setSelectedLine(line);
    setSelectedFix(null);
    setFeedback(null);
  };

  const handleFixSubmit = () => {
    if (!selectedLine) return;

    if (!selectedLine.isBuggy) {
      soundEngine.playError();
      setFeedback({
        type: 'error',
        msg: `❌ Line ${selectedLine.lineNum} contains valid logic. Check Line 6 where arithmetic operations (+, -, *, /) calculate user_balance!`,
      });
      return;
    }

    if (selectedFix === selectedLine.correctFix) {
      soundEngine.playSuccess();
      soundEngine.playWireConnect();
      setIsResolved(true);
      setFeedback({
        type: 'success',
        msg: '✨ ARITHMETIC FLAW PATCHED: Substituted "+" with "-" in Line 6. All 3/3 test suite assertions passed!',
      });
      setTimeout(() => {
        onSubmit('CLEAN_API_AUTH_VERIFIED');
      }, 1200);
    } else {
      soundEngine.playError();
      setFeedback({
        type: 'error',
        msg: '❌ Test Suite Failed: That arithmetic operator still produces incorrect quota balances or allows overdrafts!',
      });
    }
  };

  return (
    <div className="w-full bg-[#070A14] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] font-mono text-white space-y-5">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
            <Calculator className="w-5 h-5 animate-pulse text-cyan-300" />
          </div>
          <div>
            <h3 className="text-base font-black text-cyan-300">
              ARITHMETIC CODE DEBUGGER TERMINAL
            </h3>
            <p className="text-xs text-gray-400">
              Audit the microservice billing arithmetic below. Fix the calculation operator error so request charges are deducted properly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowHint((prev) => !prev);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? 'HIDE HINT' : 'HINT'}</span>
          </button>
          <span className="text-xs bg-rose-950/80 border border-rose-500/40 text-rose-300 px-3 py-1 rounded-full uppercase font-bold">
            ARITHMETIC OPERATOR BUG
          </span>
        </div>
      </div>

      {/* Hint Banner */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Look at Line 6: <code>remaining_balance = user_balance + base_charge</code>. Deducting a charge requires subtraction (<code>-</code>), not addition (<code>+</code>)!
          </span>
        </motion.div>
      )}

      {/* Code Editor Window */}
      <div className="bg-[#03060f] border border-white/10 rounded-2xl p-4 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-[11px] text-gray-400 uppercase mb-2">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>rate_limiter_arithmetic.py — Line-by-Line Arithmetic Audit</span>
          </div>
          <span className="text-cyan-400 text-[10px]">Click a line to audit</span>
        </div>

        <div className="space-y-1 overflow-x-auto">
          {ARITHMETIC_CODE_LINES.map((line) => {
            const isSelected = selectedLine?.lineNum === line.lineNum;
            const isLine6Resolved = line.lineNum === 6 && isResolved;

            return (
              <div
                key={line.lineNum}
                onClick={() => handleLineClick(line)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  !line.content.trim()
                    ? 'opacity-30'
                    : isSelected
                    ? 'bg-cyan-500/20 border border-cyan-400 text-white shadow-sm scale-[1.005] cursor-pointer'
                    : 'hover:bg-white/5 text-gray-300 cursor-pointer'
                }`}
              >
                <span className="w-7 text-right pr-3 text-gray-600 select-none text-[11px]">
                  {line.lineNum}
                </span>
                <span className={isLine6Resolved ? 'text-emerald-400 font-bold' : isSelected ? 'text-cyan-200' : ''}>
                  {isLine6Resolved ? '    remaining_balance = user_balance - base_charge  # [PATCHED]' : line.content}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Unit Test Suite Runner */}
      <div className="bg-[#030712] border border-cyan-500/20 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">LIVE ARITHMETIC UNIT TEST SUITE</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isResolved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
            {isResolved ? '3/3 TESTS PASSING' : 'TESTS FAILING (ARITHMETIC LEAK)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {TEST_CASES.map((tc) => (
            <div
              key={tc.id}
              className={`p-2.5 rounded-xl border text-[11px] transition-all ${
                isResolved
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold pb-1 mb-1 border-b border-white/5">
                <span className="text-gray-400">TEST 0{tc.id}</span>
                <span className="flex items-center gap-1 font-bold">
                  {isResolved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px]">PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400 text-[10px]">FAIL</span>
                    </>
                  )}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 truncate mb-1">
                {tc.description}
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Expected:</span>
                <span className="text-gray-300 font-bold">{tc.expectedOutput}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Actual:</span>
                <span className={`font-bold ${isResolved ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isResolved ? tc.patchedOutput : tc.buggyOutput}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspection & Arithmetic Patch Selector Tray */}
      {selectedLine && selectedLine.content.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-300">
              AUDITING LINE {selectedLine.lineNum}:
            </span>
            <span className="text-[10px] text-gray-400">
              {selectedLine.isBuggy ? 'Select arithmetic fix below' : 'Syntax valid'}
            </span>
          </div>

          <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs text-gray-200">
            <code>{selectedLine.content}</code>
          </div>

          {selectedLine.fixOptions && selectedLine.fixOptions.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-amber-300">
                PROPOSED ARITHMETIC OPERATOR PATCHES:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedLine.fixOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedFix(opt)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all font-mono cursor-pointer ${
                      selectedFix === opt
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'bg-[#10182b] border-white/10 text-gray-300 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <code>{opt}</code>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">
              Line {selectedLine.lineNum} contains standard function declaration or returns. Check Line 6 for the calculation operator error!
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleFixSubmit}
              disabled={isLoading || isResolved}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              <span>APPLY ARITHMETIC PATCH & EXECUTE TEST SUITE</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Live Feedback Alert */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl text-xs font-bold border leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
              : 'bg-red-950/80 border-red-500/50 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
          }`}
        >
          {feedback.msg}
        </motion.div>
      )}
    </div>
  );
};
