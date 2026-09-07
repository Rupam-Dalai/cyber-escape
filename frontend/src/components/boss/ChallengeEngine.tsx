import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Check, X, Eye, Cpu, Brain, Zap, Sparkles, Binary } from 'lucide-react';
import { soundEngine } from '../../services/audio';

import { InteractiveCircuitPuzzle } from './InteractiveCircuitPuzzle';

export interface GeneratedChallenge {
  id: string;
  category: string;
  question: string;
  codeSnippet?: string;
  visualDiagram?: 'flowchart' | 'shapes' | 'memory' | 'grid';
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface ChallengeEngineProps {
  actionType: 'attack' | 'heavy' | 'shield' | 'heal' | 'ultimate';
  onSolve: (isCorrect: boolean, category: string) => void;
  onCancel?: () => void;
}

// Helper to shuffle options so correct answer position is randomized every time
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generator for dynamic Brain Out, Room Escape, and Circuit challenge categories
export const generateRandomChallenge = (actionType: string): GeneratedChallenge => {
  const puzzleCategories = [
    'Circuit & Conductors',
    'Brain Out: Biggest Animal',
    'Brain Out: Shirt Holes',
    'Brain Out: Light the Bulb',
    'Brain Out: Freeze the Lava',
    'Brain Out: Hidden Barrier Key',
    'Brain Out: Equalize Balance',
    'Room Escape: Cyber Vault Code',
    'Room Escape: Mirror Keypad',
    'Room Escape: RGB Lock Wires',
    'Room Escape: Clock Hands Angle',
    'Room Escape: Prisoner 4-Digit Dial'
  ];

  const category = actionType === 'shield'
    ? 'Circuit & Conductors'
    : puzzleCategories[Math.floor(Math.random() * puzzleCategories.length)];

  const randomId = Math.random().toString(36).substring(7);

  const buildChallenge = (): GeneratedChallenge => {
    if (category === 'Circuit & Conductors') {
      return {
        id: randomId,
        category: '🔌 Interactive Circuit Connector',
        question: 'Bridge the electric circuit gap with a metallic conductor and close the knife switch to illuminate the bulb!',
        options: ['🔌 COPPER WIRE', '📏 PLASTIC RULER', '✏️ WOODEN PENCIL', '🧱 RUBBER ERASER'],
        correctAnswer: '🔌 COPPER WIRE',
      };
    }

    switch (category) {
      case 'Brain Out: Biggest Animal': {
        return {
          id: randomId,
          category: '🧠 BRAIN OUT TRICK',
          question: 'Which animal is actually the largest in real life?',
          options: ['Blue Whale', 'Elephant', 'Lion', 'Ant (Zoomed In)'],
          correctAnswer: 'Blue Whale',
          explanation: 'Do not be tricked by screen zoom! The Blue Whale is the largest animal on Earth!',
        };
      }

    case 'Brain Out: Shirt Holes': {
      return {
        id: randomId,
        category: '🧠 BRAIN OUT TRICK',
        question: 'A shirt has 2 sleeve openings, 1 neck, 1 bottom, and 2 holes cut straight through both front and back. How many total holes are in this shirt?',
        options: ['8 Holes', '6 Holes', '4 Holes', '2 Holes'],
        correctAnswer: '8 Holes',
        explanation: 'Sleeve (2) + Neck (1) + Bottom (1) + Front Cut (2) + Back Cut (2) = 8 total holes!',
      };
    }

    case 'Brain Out: Light the Bulb': {
      return {
        id: randomId,
        category: '🧠 BRAIN OUT TRICK',
        question: 'The electric battery is completely dead! How do you illuminate the light bulb in the room?',
        options: [
          'Drag the Sun from the sky over to the light bulb',
          'Rub two wooden sticks together',
          'Press the broken light switch faster',
          'Blow hard on the filament'
        ],
        correctAnswer: 'Drag the Sun from the sky over to the light bulb',
        explanation: 'Brain Out Trick: Use solar light directly by dragging the sun onto the light bulb!',
      };
    }

    case 'Brain Out: Freeze the Lava': {
      return {
        id: randomId,
        category: '🧠 BRAIN OUT TRICK',
        question: 'The Hero cannot cross the boiling molten lava bridge to reach NuLL King. How do you solidify the lava?',
        options: [
          'Drag the Rain Cloud over the boiling lava',
          'Build a wooden plank bridge',
          'Blow air with a handheld fan',
          'Jump blindly over the lava pit'
        ],
        correctAnswer: 'Drag the Rain Cloud over the boiling lava',
        explanation: 'Brain Out Trick: Dragging the rain cloud dumps cold water onto the lava to solidify it instantly!',
      };
    }

    case 'Brain Out: Hidden Barrier Key': {
      return {
        id: randomId,
        category: '🧠 BRAIN OUT TRICK',
        question: 'NuLL King locked his barrier with an invisible lock. Where is the secret key hidden?',
        options: [
          'Move the Sun behind the dark mountain to reveal the key shadow',
          'Dig under the heavy stone rock',
          'Break open the iron treasure chest',
          'Search inside the deep river'
        ],
        correctAnswer: 'Move the Sun behind the dark mountain to reveal the key shadow',
        explanation: 'Brain Out Trick: Hiding the sun casts shadows that reveal the invisible key silhouette!',
      };
    }

    case 'Brain Out: Equalize Balance': {
      return {
        id: randomId,
        category: '🧠 BRAIN OUT TRICK',
        question: 'Weight A is 50kg on the left scale. Weight B is 10kg on the right. How do you balance the scale instantly?',
        options: [
          'Drag the digital "0" from the question title onto 10kg to make it 100kg',
          'Slice the scale beam in half',
          'Take away Weight A completely',
          'Add 40kg of heavy stones'
        ],
        correctAnswer: 'Drag the digital "0" from the question title onto 10kg to make it 100kg',
        explanation: 'Brain Out Trick: Reposition numbers directly on screen to alter weight physics!',
      };
    }

    case 'Room Escape: Cyber Vault Code': {
      return {
        id: randomId,
        category: '🔑 ROOM ESCAPE PUZZLE',
        question: 'The escape room cyber vault door displays a pattern: 2+2=5, 3+3=10, 4+4=17. What keycode unlocks 5+5=?',
        options: ['26', '25', '20', '30'],
        correctAnswer: '26',
        explanation: 'Pattern Rule: (N² + 1) ➔ 5² + 1 = 26!',
      };
    }

    case 'Room Escape: Mirror Keypad': {
      return {
        id: randomId,
        category: '🔑 ROOM ESCAPE PUZZLE',
        question: 'Look closely at the mirror reflection of the keypad code written on the wall: "8055". What 4-digit code unlocks the digital keypad?',
        options: ['5508', '8055', '2055', '9055'],
        correctAnswer: '5508',
        explanation: 'Mirror Reflection flips digits horizontally: 8055 ➔ 5508!',
      };
    }

    case 'Room Escape: RGB Lock Wires': {
      return {
        id: randomId,
        category: '🔑 ROOM ESCAPE PUZZLE',
        question: 'The electronic door security lock requires cutting wires in strict ascending RGB order (Red=1, Green=2, Blue=3). Which wire sequence disarms the electronic lock?',
        options: ['1 ➔ 2 ➔ 3', '3 ➔ 2 ➔ 1', '2 ➔ 1 ➔ 3', '1 ➔ 3 ➔ 2'],
        correctAnswer: '1 ➔ 2 ➔ 3',
        explanation: 'RGB = Red (1), Green (2), Blue (3)!',
      };
    }

    case 'Room Escape: Clock Hands Angle': {
      return {
        id: randomId,
        category: '🔑 ROOM ESCAPE PUZZLE',
        question: 'The escape room clock hands point exactly to 3:15. What is the exact degree angle between the hour hand and minute hand?',
        options: ['7.5 Degrees', '0 Degrees', '15 Degrees', '90 Degrees'],
        correctAnswer: '7.5 Degrees',
        explanation: 'At 3:15, minute hand is at 90°. Hour hand moved 15 mins * 0.5° = 7.5° past 90°!',
      };
    }

    case 'Room Escape: Prisoner 4-Digit Dial': {
      return {
        id: randomId,
        category: '🔑 ROOM ESCAPE PUZZLE',
        question: 'A clue carved on the wall reads: "First digit is 1. Second is double the first. Third is 3 times first. Last is sum of first three." What is the padlock code?',
        options: ['1236', '2468', '1438', '2439'],
        correctAnswer: '1236',
        explanation: 'Digit 1 = 1, Digit 2 = 2, Digit 3 = 3, Digit 4 = (1+2+3=6) ➔ 1236!',
      };
    }

      default: {
        return {
          id: randomId,
          category: '🔌 Interactive Circuit Connector',
          question: 'Bridge the electric circuit gap with a metallic conductor to illuminate the light bulb!',
          options: ['🔌 COPPER WIRE', '📏 PLASTIC RULER', '✏️ WOODEN PENCIL', '🧱 RUBBER ERASER'],
          correctAnswer: '🔌 COPPER WIRE',
        };
      }
    }
  };

  const raw = buildChallenge();
  return {
    ...raw,
    options: shuffleArray(raw.options),
  };
};

export const ChallengeEngine: React.FC<ChallengeEngineProps> = ({
  actionType,
  onSolve,
  onCancel,
}) => {
  const [challenge, setChallenge] = useState<GeneratedChallenge | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setChallenge(generateRandomChallenge(actionType));
    setSelectedOption(null);
  }, [actionType]);

  const handleSubmit = (option: string) => {
    setSelectedOption(option);
    const isCorrect = option === challenge?.correctAnswer;
    if (isCorrect) {
      soundEngine.playSuccess();
    } else {
      soundEngine.playError();
    }

    setTimeout(() => {
      onSolve(isCorrect, challenge?.category || 'General');
    }, 800);
  };

  if (!challenge) return null;

  if (challenge.category === 'Circuit & Conductors') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <InteractiveCircuitPuzzle
          onSolve={(isCorrect) => onSolve(isCorrect, 'Circuit & Conductors')}
          onCancel={onCancel}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#090D16] border-2 border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-6 relative overflow-hidden">
        
        {/* Glow Bar Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {challenge.category}
              </span>
              <h3 className="text-base font-extrabold font-mono text-white mt-1">
                COMBAT TACTIC DECRYPTION
              </h3>
            </div>
          </div>

          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
            ACTION: {actionType}
          </span>
        </div>

        {/* Question Text */}
        <div className="bg-[#04060B] border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-sm sm:text-base font-sans text-gray-200 leading-relaxed font-semibold">
            {challenge.question}
          </p>

          {/* Visual Shape Diagram if applicable */}
          {challenge.visualDiagram === 'shapes' && (
            <div className="bg-black/60 p-4 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-center gap-3">
              {Array.from({ length: parseInt(challenge.correctAnswer) || 5 }).map((_, idx) => (
                <div key={idx} className="w-6 h-6 bg-cyan-400/80 rounded-md rotate-45 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              ))}
              <div className="w-6 h-6 bg-rose-500/40 rounded-full" />
              <div className="w-6 h-6 bg-purple-500/40 rounded-full" />
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {challenge.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === challenge.correctAnswer;

            let btnStyle = 'bg-hunt-surface/90 border-white/10 hover:border-cyan-500/60 text-white';
            if (selectedOption) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
              } else if (isSelected) {
                btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
              } else {
                btnStyle = 'bg-hunt-surface/40 border-white/5 text-gray-600 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => !selectedOption && handleSubmit(opt)}
                disabled={!!selectedOption}
                className={`p-4 rounded-2xl border font-mono text-sm font-bold text-left transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {selectedOption && isCorrect && <Check className="w-5 h-5 text-emerald-400" />}
                {selectedOption && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Action button */}
        {onCancel && !selectedOption && (
          <div className="text-right">
            <button
              onClick={onCancel}
              className="text-xs font-mono text-gray-400 hover:text-white underline"
            >
              RETREAT FROM ACTION
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
