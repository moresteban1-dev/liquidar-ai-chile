'use client';

import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface SEOPreviewProps {
  title: string;
  url: string;
  description: string;
  keywords?: string[];
  className?: string;
}

export function SEOPreview({
  title,
  url,
  description,
  keywords = [],
  className
}: SEOPreviewProps) {
  
  // Highlight keywords in description by making them bold
  const highlightKeywords = (text: string) => {
    if (!keywords.length) return text;
    
    // Sort keywords by length descending to prevent partial word matches
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    
    // Create regex pattern to match whole words
    const pattern = new RegExp(`\\b(${sortedKeywords.join('|')})\\b`, 'gi');
    
    // We need to return an array of React nodes
    const parts = text.split(pattern);
    
    return parts.map((part, index) => {
      // Check if this part matches a keyword
      const isKeyword = sortedKeywords.some(k => k.toLowerCase() === part.toLowerCase());
      
      if (isKeyword) {
        return <strong key={index} className="font-bold text-slate-800 dark:text-slate-200">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={cn("border border-border rounded-xl p-6 bg-white dark:bg-[#1a1f3d] shadow-sm", className)}>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vista Previa de Búsqueda
        </span>
      </div>
      
      <div className="max-w-[600px]">
        {/* Google URL structure */}
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <ExternalLink className="h-3.w-3 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-[#202124] dark:text-[#dadce0] font-normal leading-none">
              Tu Dominio
            </span>
            <span className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-none mt-1">
              https://tusitio.com {url ? `› ${url}` : ''}
            </span>
          </div>
        </div>
        
        {/* Title - Google Blue */}
        <h3 className="text-xl text-[#1a0dab] dark:text-[#8ab4f8] font-normal mb-1 hover:underline cursor-pointer leading-tight truncate">
          {title || 'Título de tu página | Nombre de Empresa'}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] leading-snug line-clamp-2">
          {description ? highlightKeywords(description) : 'Esta es la meta descripción que aparecerá en los resultados de búsqueda. Debe contener tu keyword principal y un llamado a la acción para aumentar el CTR.'}
        </p>
      </div>
    </div>
  );
}
