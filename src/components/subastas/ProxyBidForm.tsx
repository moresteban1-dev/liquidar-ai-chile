'use client';

/**
 * @file ProxyBidForm.tsx
 * @description Proxy bid form for auction lots.
 * Users set a maximum bid; the system automatically bids up to that amount.
 * Includes client-side validation and CLP auto-formatting.
 */

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Info, CheckCircle } from 'lucide-react';
import { CLPFormatter } from '@/lib/chile/clp-formatter';
import type { Lote, PujaFormError } from '@/types/liquidar';

interface ProxyBidFormProps {
  lote: Lote;
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Proxy Bid Form — allows users to set a maximum bid amount.
 * The system will automatically bid up to that maximum.
 */
export default function ProxyBidForm({ lote, isAuthenticated = false }: ProxyBidFormProps) {
  const router = useRouter();
  const inputId = useId();

  const [rawInput, setRawInput] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [fieldError, setFieldError] = useState<PujaFormError | null>(null);

  const minimumRequired = lote.precioActual + lote.incrementoMinimo;

  // ─── Input Handler ──────────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only allow digits
    const digits = e.target.value.replace(/[^0-9]/g, '');
    setRawInput(digits);
    setFieldError(null);
  }

  const parsedAmount = parseInt(rawInput, 10);
  const displayAmount = rawInput ? CLPFormatter.format(parsedAmount) : '';

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(): PujaFormError | null {
    if (!rawInput || isNaN(parsedAmount)) {
      return { field: 'montoMaximo', message: 'Ingresa tu puja máxima' };
    }
    if (parsedAmount < minimumRequired) {
      return {
        field: 'montoMaximo',
        message: `Tu puja debe ser al menos ${CLPFormatter.format(minimumRequired)} (precio actual + ${CLPFormatter.formatIncrement(lote.incrementoMinimo)})`,
      };
    }
    return null;
  }

  // ─── Submit Handler ─────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/registro?redirect=' + encodeURIComponent(`/subastas/${lote.id}`));
      return;
    }

    const error = validate();
    if (error) {
      setFieldError(error);
      return;
    }

    setFormState('submitting');

    try {
      // TODO: Replace with actual API call to /api/pujas
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      console.log('[ProxyBidForm] Puja confirmada:', {
        loteId: lote.id,
        montoMaximo: parsedAmount,
        tipo: 'proxy',
      });

      setFormState('success');
      setRawInput('');
    } catch (err) {
      console.error('[ProxyBidForm] Error al pujar:', err);
      setFieldError({ field: 'general', message: 'Error al procesar tu puja. Inténtalo nuevamente.' });
      setFormState('error');
    }
  }

  // ─── Success State ───────────────────────────────────────────────────────────

  if (formState === 'success') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-white font-semibold text-lg mb-1">¡Puja confirmada!</h3>
        <p className="text-muted-foreground text-sm">
          El sistema pujará automáticamente hasta tu máximo de{' '}
          <span className="text-emerald-400 font-medium">{CLPFormatter.format(parsedAmount)}</span>.
          Te notificaremos si alguien te supera.
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors underline"
        >
          Modificar puja
        </button>
      </div>
    );
  }

  // ─── Main Form ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Price info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Precio actual</span>
        <span className="text-white font-semibold">{CLPFormatter.format(lote.precioActual)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Puja mínima requerida</span>
        <span className="text-amber-400 font-semibold">{CLPFormatter.format(minimumRequired)}</span>
      </div>

      <div className="border-t border-white/10 pt-4">
        <label htmlFor={inputId} className="block text-sm font-medium text-white mb-2">
          Tu puja máxima (CLP)
        </label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            $
          </span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            value={rawInput}
            onChange={handleInputChange}
            placeholder="0"
            disabled={formState === 'submitting'}
            aria-invalid={fieldError?.field === 'montoMaximo'}
            aria-describedby={fieldError ? `${inputId}-error` : `${inputId}-hint`}
            className={`w-full pl-7 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
              fieldError?.field === 'montoMaximo'
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-indigo-500/30 focus:border-indigo-500/50'
            }`}
          />
        </div>

        {/* Live formatted preview */}
        {displayAmount && !fieldError && (
          <p className="mt-1 text-sm text-emerald-400 font-medium">{displayAmount}</p>
        )}

        {/* Error message */}
        {fieldError && fieldError.field === 'montoMaximo' && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
            {fieldError.message}
          </p>
        )}

        {/* Hint */}
        {!fieldError && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            El sistema pujará automáticamente hasta tu máximo
          </p>
        )}
      </div>

      {/* General error */}
      {fieldError?.field === 'general' && (
        <p className="text-sm text-red-400 text-center" role="alert">
          {fieldError.message}
        </p>
      )}

      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
      >
        {formState === 'submitting' ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando...
          </>
        ) : !isAuthenticated ? (
          <>
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Regístrate para Pujar
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Confirmar Puja
          </>
        )}
      </button>

      {!isAuthenticated && (
        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a
            href={`/login?redirect=${encodeURIComponent(`/subastas/${lote.id}`)}`}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Inicia sesión
          </a>
        </p>
      )}
    </form>
  );
}
