'use client';

/**
 * @file CountdownTimer.tsx
 * @description Real-time countdown timer for auction lots.
 * Displays remaining time in a color-coded format.
 * - Green: > 1 hour remaining
 * - Amber + pulse: < 1 hour remaining
 * - Red: Auction ended
 */

import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  /** ISO string or Date object for the auction end time */
  endDate: Date | string;
  /** Callback invoked when the timer reaches zero */
  onExpired?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show the clock icon */
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

function calculateTimeRemaining(endDate: Date | string): TimeRemaining {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Displays a live countdown timer for an auction lot.
 * Automatically updates every second using a cleanup-safe interval.
 */
export default function CountdownTimer({
  endDate,
  onExpired,
  className = '',
  showIcon = true,
}: CountdownTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(endDate));
  const [isExpired, setIsExpired] = useState(false);

  const tick = useCallback(() => {
    const remaining = calculateTimeRemaining(endDate);
    setTime(remaining);

    if (remaining.totalSeconds === 0 && !isExpired) {
      setIsExpired(true);
      onExpired?.();
    }
  }, [endDate, isExpired, onExpired]);

  useEffect(() => {
    // Initialize immediately
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // ─── Expired State ──────────────────────────────────────────────────────────
  if (isExpired || time.totalSeconds === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-red-400 font-medium text-sm ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
        Terminada
      </span>
    );
  }

  // ─── Color Logic ────────────────────────────────────────────────────────────
  const isUrgent = time.totalSeconds < 3600;    // < 1 hour
  const isCritical = time.totalSeconds < 300;   // < 5 minutes

  const colorClass = isCritical
    ? 'text-red-400'
    : isUrgent
      ? 'text-amber-400'
      : 'text-emerald-400';

  const pulseClass = isUrgent ? 'animate-pulse' : '';

  // ─── Display Format ─────────────────────────────────────────────────────────
  let displayText: string;
  if (time.days > 0) {
    displayText = `${time.days}d ${pad(time.hours)}h ${pad(time.minutes)}m`;
  } else if (time.hours > 0) {
    displayText = `${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`;
  } else {
    displayText = `${pad(time.minutes)}:${pad(time.seconds)}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold text-sm ${colorClass} ${pulseClass} ${className}`}
      aria-label={`Tiempo restante: ${displayText}`}
      aria-live="polite"
    >
      {showIcon && <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
      {displayText}
    </span>
  );
}
