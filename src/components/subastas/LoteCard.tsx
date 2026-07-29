import Link from 'next/link';
import { MapPin, Package, Tag } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { CLPFormatter } from '@/lib/chile/clp-formatter';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import type { Lote } from '@/types/liquidar';

interface LoteCardProps {
  lote: Lote;
}

const CONDICION_LABELS = {
  nuevo: { label: 'Nuevo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  como_nuevo: { label: 'Como Nuevo', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  bueno: { label: 'Bueno', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  aceptable: { label: 'Aceptable', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

// Gradient backgrounds per category for placeholder images
const CATEGORIA_GRADIENTS: Record<string, string> = {
  electronica: 'from-blue-900/60 to-indigo-900/40',
  ropa: 'from-pink-900/60 to-purple-900/40',
  muebles: 'from-amber-900/60 to-orange-900/40',
  herramientas: 'from-gray-700/60 to-zinc-900/40',
  juguetes: 'from-red-900/60 to-pink-900/40',
  deportes: 'from-green-900/60 to-emerald-900/40',
  electrodomesticos: 'from-cyan-900/60 to-blue-900/40',
  computacion: 'from-violet-900/60 to-purple-900/40',
  hogar: 'from-yellow-900/60 to-amber-900/40',
  otros: 'from-slate-700/60 to-gray-900/40',
};

/**
 * Auction lot card component for the listings grid.
 * Displays key lot information with live countdown and CLP pricing.
 */
export default function LoteCard({ lote }: LoteCardProps) {
  const condicion = CONDICION_LABELS[lote.condicion];
  const gradient = CATEGORIA_GRADIENTS[lote.categoria] ?? CATEGORIA_GRADIENTS.otros;
  const categoriaLabel = CATEGORIA_LABELS[lote.categoria] ?? lote.categoria;

  return (
    <Link
      href={`/subastas/${lote.id}`}
      className="group block bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Package className="w-10 h-10 text-white/20" aria-hidden="true" />
          <span className="text-white/30 text-xs font-medium">{lote.loteNumero}</span>
        </div>

        {/* Retailer badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white/80 text-xs font-semibold rounded-full border border-white/10">
            {lote.retailerOrigen}
          </span>
        </div>

        {/* Condition badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${condicion.color}`}>
            {condicion.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category + Title */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tag className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground text-xs">{categoriaLabel}</span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {lote.titulo}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">{CLPFormatter.format(lote.precioActual)}</span>
          {lote.precioActual > lote.precioBase && (
            <span className="text-xs text-muted-foreground line-through">
              {CLPFormatter.format(lote.precioBase)}
            </span>
          )}
        </div>

        {/* Footer: Timer + Region + Bids */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <CountdownTimer endDate={lote.fechaFin} showIcon />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {lote.region}
            </span>
            <span>{lote.totalPujas} pujas</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
