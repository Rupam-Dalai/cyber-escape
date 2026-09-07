import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ZoomIn, ZoomOut, Maximize2, X, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';
import { Quest } from '../../types';

import { CHALLENGE_IMAGES } from '../map/mapAssets';

interface PictorialChallengeProps {
  quest: Quest;
}

export const PictorialChallenge: React.FC<PictorialChallengeProps> = ({ quest }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const resolvedImageSrc = (quest.image_url && CHALLENGE_IMAGES[quest.image_url]) || quest.image_url;

  return (
    <div className="bg-[#060911] border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden font-mono">
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold tracking-wider">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>VISUAL / PICTORIAL UI UX CHALLENGE</span>
        </div>
        <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full font-bold">
          INSPECT GRAPHIC CAREFULLY
        </span>
      </div>

      {/* Main Image Container */}
      {resolvedImageSrc && (
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/60 mb-5 flex items-center justify-center p-2">
          
          <img
            src={resolvedImageSrc}
            alt={quest.title}
            className="w-full max-h-[380px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Hover Zoom Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <button
              onClick={() => setIsZoomed(true)}
              className="pointer-events-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Maximize2 className="w-4 h-4" /> ENLARGE IMAGE
            </button>
          </div>
        </div>
      )}

      {/* Narrative & Visual Instructions */}
      {quest.code_content && (
        <div className="bg-[#0A0E18] border border-amber-500/20 rounded-2xl p-4 text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
          {quest.code_content}
        </div>
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && resolvedImageSrc && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full bg-[#0A0E1A] border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center"
            >
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> HIGH RESOLUTION INSPECTOR VIEW
              </h3>

              <img
                src={resolvedImageSrc}
                alt={quest.title}
                className="max-h-[80vh] w-auto object-contain rounded-xl border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
