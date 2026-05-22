'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AILoadingStateProps {
  phases: string[];
  currentPhaseIndex: number;
  title?: string;
  className?: string;
}

export function AILoadingState({
  phases,
  currentPhaseIndex,
  title = "Procesando con IA...",
  className
}: AILoadingStateProps) {
  // Ensure index is within bounds
  const safeIndex = Math.max(0, Math.min(currentPhaseIndex, phases.length - 1));
  const currentText = phases[safeIndex];

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-6 rounded-xl glass-card", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="relative h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        
        <div className="h-6 overflow-hidden relative w-64 mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={safeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium absolute inset-0 text-center"
            >
              {currentText}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex gap-2">
        {phases.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 rounded-full transition-all duration-500 ease-out",
              i === safeIndex ? "w-6 bg-indigo-500" : 
              i < safeIndex ? "w-2 bg-indigo-300 dark:bg-indigo-700" : 
              "w-2 bg-slate-200 dark:bg-slate-800"
            )}
          />
        ))}
      </div>
    </div>
  );
}
