'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export type BackgroundMode = 'noir' | 'night' | 'aurora' | 'midnight';

interface BackgroundControllerProps {
  mode: BackgroundMode;
  onModeChange: (mode: BackgroundMode) => void;
}

export function BackgroundController({ mode, onModeChange }: BackgroundControllerProps) {
  // In a real implementation, this would control Three.js uniforms or global CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme-mode', mode);
  }, [mode]);

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      {(['noir', 'night', 'aurora', 'midnight'] as BackgroundMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`px-3 py-1 text-xs uppercase tracking-wider rounded-full border transition-all ${
            mode === m 
              ? 'border-gold text-black bg-gold' 
              : 'border-white/20 text-white/50 hover:border-gold/50 hover:text-gold'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
