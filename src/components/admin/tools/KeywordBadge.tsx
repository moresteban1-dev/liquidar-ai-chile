'use client';

import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type KeywordType = 'primary' | 'secondary' | 'long-tail';

interface KeywordBadgeProps {
  keyword: string;
  type: KeywordType;
  volume?: string | number;
  className?: string;
}

const TYPE_CONFIG = {
  primary: {
    base: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
  },
  secondary: {
    base: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    hover: 'hover:bg-slate-200 dark:hover:bg-slate-700'
  },
  'long-tail': {
    base: 'bg-transparent text-muted-foreground border-dashed border-border',
    hover: 'hover:bg-muted'
  }
};

export function KeywordBadge({
  keyword,
  type,
  volume,
  className
}: KeywordBadgeProps) {
  const config = TYPE_CONFIG[type];

  const handleCopy = () => {
    navigator.clipboard.writeText(keyword);
    toast.success(`Keyword copiada: ${keyword}`);
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "cursor-pointer transition-all duration-200 py-1.5 px-3 flex items-center gap-2",
        config.base,
        config.hover,
        className
      )}
      onClick={handleCopy}
      title="Hacer clic para copiar"
    >
      <span className="font-medium">{keyword}</span>
      
      {volume && (
        <span className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded-sm ml-1 opacity-80">
          Vol: {volume}
        </span>
      )}
      
      <Copy className="h-3 w-3 opacity-50 ml-1" />
    </Badge>
  );
}
