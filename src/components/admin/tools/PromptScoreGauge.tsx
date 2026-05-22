'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PromptScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const SIZES = {
  sm: { width: 80, stroke: 6, fontSize: 'text-xl' },
  md: { width: 120, stroke: 8, fontSize: 'text-3xl' },
  lg: { width: 160, stroke: 12, fontSize: 'text-5xl' }
};

export function PromptScoreGauge({
  score,
  size = 'md',
  animated = true,
  className
}: PromptScoreGaugeProps) {
  // Ensure score is between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine color based on score
  let colorClass = 'text-red-500';
  let strokeColor = '#ef4444'; // red-500
  
  if (normalizedScore > 80) {
    colorClass = 'text-green-500';
    strokeColor = '#10b981'; // green-500
  } else if (normalizedScore > 60) {
    colorClass = 'text-indigo-500';
    strokeColor = '#6366f1'; // indigo-500
  } else if (normalizedScore > 30) {
    colorClass = 'text-amber-500';
    strokeColor = '#f59e0b'; // amber-500
  }

  const { width, stroke, fontSize } = SIZES[size];
  const radius = (width - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center relative", className)}>
      <div className="relative" style={{ width, height: width }}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-muted/30"
          />
          {/* Foreground circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: dashOffset }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tracking-tighter", colorClass, fontSize)}>
            {normalizedScore}
          </span>
        </div>
      </div>
      
      {size !== 'sm' && (
        <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Calidad Global
        </span>
      )}
    </div>
  );
}
