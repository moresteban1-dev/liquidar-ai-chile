import Link from 'next/link';
import { MapPin, Package, Tag, Truck, Box, FileText, Zap } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { CLPFormatter } from '@/lib/chile/clp-formatter';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import type { Lote, TamanoLote, FormatoVenta } from '@/types/liquidar';

interface LoteCardProps {
  lote: Lote;
}

const CONDICION_LABELS = {
  nuevo: { label: 'Nuevo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  como_nuevo: { label: 'Como Nuevo', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  bueno: { label: 'Bueno', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  aceptable: { label: 'Aceptable', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

const TAMANO_LOTE_CONFIG: Record<TamanoLote, { label: string; icon: typeof Package; color: string }> = {
  unidad_individual: { label: 'Unidad Individual', icon: Box, color: 'bg-zinc-800 text-zinc-300' },
  palet_completo: { label: 'Palet Completo', icon: Package, color: 'bg-amber-900/60 text-amber-300 border-amber-500/30' },
  camion_truckload: { label: 'Camión Truckload', icon: Truck, color: 'bg-purple-900/60 text-purple-300 border-purple-500/30' },
  item_voluminoso: { label: 'Ítem Voluminoso', icon: Box, color: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30' },
};

const FORMATO_VENTA_CONFIG: Record<FormatoVenta, { label: string; color: string }> = {
  subasta_estandar: { label: '🔨 Subasta', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  precio_fijo: { label: '🏷️ Compra Ya', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  sobre_cerrado: { label: '🔒 Sobre Cerrado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  formato_mixto: { label: '⚡ Subasta + Compra Ya', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
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
 * Displays key lot information with live countdown, B2B dimensions, MSRP savings, and CLP pricing.
 */
export default function LoteCard({ lote }: LoteCardProps) {
  const condicion = CONDICION_LABELS[lote.condicion] || CONDICION_LABELS.bueno;
  const gradient = CATEGORIA_GRADIENTS[lote.categoria] ?? CATEGORIA_GRADIENTS.otros;
  const categoriaLabel = CATEGORIA_LABELS[lote.categoria] ?? lote.categoria;
  
  const tamanoConfig = lote.tamanoLote ? TAMANO_LOTE_CONFIG[lote.tamanoLote] : TAMANO_LOTE_CONFIG.palet_completo;
  const formatoConfig = lote.formatoVenta ? FORMATO_VENTA_CONFIG[lote.formatoVenta] : FORMATO_VENTA_CONFIG.subasta_estandar;
  const TamanoIcon = tamanoConfig.icon;

  const msrpAhorroPercent = lote.msrpTotal && lote.msrpTotal > 0
    ? Math.round(((lote.msrpTotal - lote.precioActual) / lote.msrpTotal) * 100)
    : null;

  return (
    <Link
      href={`/subastas/${lote.id}`}
      className="group block bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <TamanoIcon className="w-12 h-12 text-white/20" aria-hidden="true" />
          <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">{tamanoConfig.label}</span>
          <span className="text-white/30 text-[10px]">{lote.loteNumero}</span>
        </div>

        {/* Retailer badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white/90 text-xs font-semibold rounded-md border border-white/10 shadow-sm">
            {lote.retailerOrigen}
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md border backdrop-blur-sm ${tamanoConfig.color}`}>
            {tamanoConfig.label}
          </span>
        </div>

        {/* Condition & Format Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border backdrop-blur-sm ${condicion.color}`}>
            {condicion.label}
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md border backdrop-blur-sm ${formatoConfig.color}`}>
            {formatoConfig.label}
          </span>
        </div>

        {/* MSRP Savings Pill if available */}
        {msrpAhorroPercent !== null && msrpAhorroPercent > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-0.5 bg-emerald-500/90 text-black text-[11px] font-extrabold rounded-full shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3 fill-black" />
              {msrpAhorroPercent}% DSCTO MSRP
            </span>
          </div>
        )}

        {/* Manifest indicator */}
        {lote.manifestUrl && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-white/80 text-[10px] font-medium rounded-md border border-white/10 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              Manifiesto PDF
            </span>
          </div>
        )}
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

        {/* Valuation & Current Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">
              {lote.formatoVenta === 'precio_fijo' ? 'Precio Compra Ya:' : 'Puja Actual:'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">
                {CLPFormatter.format(lote.precioCompraYa || lote.precioActual)}
              </span>
            </div>
          </div>

          {lote.msrpTotal && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">MSRP Retail</span>
              <span className="text-xs text-zinc-400 font-medium line-through">
                {CLPFormatter.format(lote.msrpTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Timer + Region + Bids */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
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

