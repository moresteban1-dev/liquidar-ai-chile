'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Bot, ExternalLink, FileSpreadsheet, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  'search': Search,
  'bot': Bot,
  'external-link': ExternalLink,
  'file-spreadsheet': FileSpreadsheet
};

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
  gradientFrom: string;
  gradientTo: string;
  statsLabel?: string;
  statsValue?: string | number;
  delay?: number;
}

export function ToolCard({
  title,
  description,
  icon,
  href,
  badge,
  gradientFrom,
  gradientTo,
  statsLabel,
  statsValue,
  delay = 0,
}: ToolCardProps) {
  const Icon = ICON_MAP[icon] || Bot;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Link href={href} className="block h-full outline-none">
        <Card className={cn(
          "h-full glass transition-all duration-300",
          "hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30",
          "hover:-translate-y-1 group relative overflow-hidden"
        )}>
          {/* Background subtle glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
          
          <CardHeader className="pb-3 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center shadow-inner"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              
              {badge && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  {badge}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {description}
            </p>
            
            {(statsLabel || statsValue) && (
              <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{statsLabel}</span>
                <span className="text-sm font-bold text-foreground">{statsValue}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
