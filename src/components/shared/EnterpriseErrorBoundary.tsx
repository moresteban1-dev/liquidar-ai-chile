'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { getTelemetryProvider } from '@/core/application/ports/ITelemetryPort';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  componentName?: string;
}

/**
 * EnterpriseErrorBoundary
 * 
 * Componente defensivo premium para capturar fallos en tiempo de ejecución,
 * reportar telemetría y ofrecer una experiencia de recuperación elegante.
 */
export default function EnterpriseErrorBoundary({
  error,
  reset,
  componentName = 'Dashboard UI'
}: Props) {
  
  useEffect(() => {
    // Reportar el error a la infraestructura de telemetría (OpenTelemetry / Sentry / Custom)
    const telemetry = getTelemetryProvider();
    telemetry.logger.error(`[UI CRASH] ${componentName} failed`, {
      digest: error.digest,
      message: error.message,
      stack: error.stack
    });
    
    // Grado Automático: Métrica de fallo UI
    telemetry.metrics.recordStateTransition('UI_CRASH', 'SYSTEM_AUDIT');
  }, [error, componentName]);

  return (
    <div className="min-h-[400px] w-full flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Algo no salió como esperábamos
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
            Hemos detectado un error técnico en esta sección del {componentName}. 
            Nuestro equipo de ingeniería ha sido notificado automáticamente.
          </p>

          {error.digest && (
            <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 mb-8 border border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Error ID</span>
              <code className="text-xs text-neutral-600 dark:text-neutral-300 break-all select-all font-mono">
                {error.digest}
              </code>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => reset()}
              className="group flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reintentar</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center space-x-2 py-3 px-4 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold transition-all active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </button>
          </div>
        </div>
        
        <div className="px-8 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[10px] text-neutral-400 uppercase tracking-tighter text-center">
            Dropservice Platform — Deep Clean Protection V2
          </p>
        </div>
      </motion.div>
    </div>
  );
}
