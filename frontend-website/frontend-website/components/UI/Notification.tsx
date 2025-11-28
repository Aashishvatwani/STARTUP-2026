'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationProps {
  id: string;
  type?: NotificationType;
  title?: string;
  message: string;
  isVisible: boolean;
  onClose: (id: string) => void;
  duration?: number; // in ms
}

const icons = {
  success: (
    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function Notification({
  id,
  type = 'info',
  title,
  message,
  isVisible,
  onClose,
  duration = 5000,
}: NotificationProps) {
  
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose, id]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={twMerge(clsx(
            "fixed top-6 right-6 z-[100] w-full max-w-sm overflow-hidden rounded-xl border backdrop-blur-md shadow-2xl",
            type === 'success' && "bg-green-900/20 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
            type === 'error' && "bg-red-900/20 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]",
            type === 'warning' && "bg-yellow-900/20 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]",
            type === 'info' && "bg-blue-900/20 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          ))}
        >
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 pt-0.5">
              {icons[type]}
            </div>
            <div className="flex-1 pt-0.5">
              {title && <h3 className="text-sm font-bold text-white mb-1">{title}</h3>}
              <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => onClose(id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar (optional visual flair) */}
          {duration > 0 && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={clsx(
                "h-1",
                type === 'success' && "bg-green-500/50",
                type === 'error' && "bg-red-500/50",
                type === 'warning' && "bg-yellow-500/50",
                type === 'info' && "bg-blue-500/50"
              )}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
