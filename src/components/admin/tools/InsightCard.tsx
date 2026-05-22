'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightEffort = 'low' | 'medium' | 'high';

interface InsightCardProps {
  insight: string;
  category: string;
  priority: InsightPriority;
  action?: string;
  effort?: InsightEffort;
  className?: string;
}

const PRIORITY_CONFIG = {
  low: {
    color: 'bg-slate-500',
    border: 'border-l-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    icon: Lightbulb
  },
  medium: {
    color: 'bg-blue-500',
    border: 'border-l-blue-500',
    bg: 'bg-blue-50/50 dark:bg-blue-900/20',
    icon: Target
  },
  high: {
    color: 'bg-amber-500',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-900/20',
    icon: Zap
  },
  critical: {
    color: 'bg-red-500',
    border: 'border-l-red-500',
    bg: 'bg-red-50/50 dark:bg-red-900/20',
    icon: AlertCircle
  }
};

const EFFORT_LABELS = {
  low: 'Esfuerzo Bajo',
  medium: 'Esfuerzo Medio',
  high: 'Esfuerzo Alto'
};

export function InsightCard({
  insight,
  category,
  priority,
  action,
  effort,
  className
}: InsightCardProps) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200 hover:shadow-md",
      config.border,
      config.bg,
      className
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("p-1 rounded-md text-white", config.color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </span>
          </div>
          
          {effort && (
            <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-background">
              {EFFORT_LABELS[effort]}
            </Badge>
          )}
        </div>
        
        <p className="text-sm font-medium text-foreground mb-3">
          {insight}
        </p>
        
        {action && (
          <div className="bg-background/80 rounded-md p-3 border border-border/50">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
              ACCIÓN SUGERIDA
            </span>
            <p className="text-sm text-muted-foreground">
              {action}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
